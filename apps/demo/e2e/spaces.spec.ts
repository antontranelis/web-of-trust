import { test, expect } from '@playwright/test'
import { createIdentity } from './helpers/identity'
import { createFreshContext, waitForRelayConnected } from './helpers/common'
import { performMutualVerification } from './helpers/verification'
import { createSpace, inviteMember, acceptSpaceInvite, sendMessage, expectMessage, expectMemberCount, removeMember } from './helpers/spaces'

test.describe('Spaces', () => {
  test('create space, invite member, shared chat with CRDT merge, remove member', async ({ browser }) => {
    const { context: aliceCtx, page: alicePage } = await createFreshContext(browser)
    const { context: bobCtx, page: bobPage } = await createFreshContext(browser)

    try {
      // Setup: onboard + verify
      await createIdentity(alicePage, { name: 'Alice', passphrase: 'alice123pw' })
      await createIdentity(bobPage, { name: 'Bob', passphrase: 'bob12345pw' })
      await waitForRelayConnected(alicePage)
      await waitForRelayConnected(bobPage)
      await performMutualVerification(alicePage, bobPage)

      // Alice creates a space
      await createSpace(alicePage, 'Gartengruppe')
      await expectMemberCount(alicePage, 1)

      // Alice invites Bob
      await inviteMember(alicePage, 'Bob')
      await expectMemberCount(alicePage, 2)

      // Bob receives the space invite
      await acceptSpaceInvite(bobPage)

      // Bob sees the space detail
      await expect(bobPage.getByText('Gartengruppe').first()).toBeVisible({ timeout: 10_000 })

      // Alice sends a chat message
      await sendMessage(alicePage, 'Tomaten pflanzen')

      // Bob sees Alice's message (CRDT sync)
      await expectMessage(bobPage, 'Tomaten pflanzen')

      // Bob sends a message
      await sendMessage(bobPage, 'Und Gurken säen')

      // Alice sees Bob's message
      await expectMessage(alicePage, 'Und Gurken säen')

      // Alice removes Bob
      await removeMember(alicePage)
      await expectMemberCount(alicePage, 1)

      // Bob gets redirected away from the space
      await expect(bobPage).toHaveURL(/\/chats/, { timeout: 15_000 })
    } finally {
      await aliceCtx.close()
      await bobCtx.close()
    }
  })
})
