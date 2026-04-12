import { test, expect } from '@playwright/test'
import { createIdentity } from './helpers/identity'
import { createFreshContext, waitForRelayConnected, navigateTo } from './helpers/common'
import { performMutualVerification } from './helpers/verification'
import { goOffline, goOnline, waitForReconnect } from './helpers/offline'
import { createSpace, inviteMember, acceptSpaceInvite, expectMemberCount } from './helpers/spaces'

test.describe('Offline Spaces', () => {
  test('create space offline → visible locally, invite while offline → appears on reconnect', async ({ browser }) => {
    const { context: aliceCtx, page: alicePage } = await createFreshContext(browser)
    const { context: bobCtx, page: bobPage } = await createFreshContext(browser)

    try {
      // Setup: create identities, verify each other
      await createIdentity(alicePage, { name: 'Alice', passphrase: 'alice123pw' })
      await createIdentity(bobPage, { name: 'Bob', passphrase: 'bob12345pw' })

      await waitForRelayConnected(alicePage)
      await waitForRelayConnected(bobPage)

      await performMutualVerification(alicePage, bobPage)

      // --- Part 1: Alice creates a space while offline ---
      await goOffline(aliceCtx)
      await alicePage.waitForTimeout(2_000)

      await createSpace(alicePage, 'Offline-Space')

      // Go back online
      await goOnline(aliceCtx)
      await navigateTo(alicePage, '/')
      await waitForReconnect(alicePage)

      // Space should still be visible after reconnect
      await navigateTo(alicePage, '/chats')
      await expect(alicePage.getByText('Offline-Space').first()).toBeVisible({ timeout: 10_000 })

      // --- Part 2: Bob goes offline, Alice invites Bob ---
      await goOffline(bobCtx)
      await bobPage.waitForTimeout(2_000)

      // Alice opens the space and invites Bob
      await alicePage.getByText('Offline-Space').first().click()
      await expectMemberCount(alicePage, 1)
      await inviteMember(alicePage, 'Bob')
      await expectMemberCount(alicePage, 2)

      // --- Bob comes back online → Space invite should appear ---
      await goOnline(bobCtx)
      await navigateTo(bobPage, '/')
      await waitForReconnect(bobPage)

      // Bob should receive the space invite
      await acceptSpaceInvite(bobPage)

      // Bob should see the space
      await navigateTo(bobPage, '/chats')
      await expect(bobPage.getByText('Offline-Space').first()).toBeVisible({ timeout: 10_000 })
    } finally {
      await aliceCtx.close()
      await bobCtx.close()
    }
  })
})
