import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { navigateTo } from './common'

/**
 * Create a new space via the UI.
 * Navigates to /chats/new, fills in the name, submits.
 * Returns on the space detail page.
 */
export async function createSpace(page: Page, name: string): Promise<void> {
  await navigateTo(page, '/chats')
  await page.getByText('Erstellen', { exact: true }).click()
  await page.getByPlaceholder('z.B. Gartengruppe, Familie...').fill(name)
  await page.locator('form button[type="submit"], form button:has-text("Erstellen")').last().click()
  await expect(page.getByText(name).first()).toBeVisible({ timeout: 10_000 })
}

/**
 * Invite a contact to the currently open space.
 */
export async function inviteMember(page: Page, contactName: string): Promise<void> {
  await page.getByText('Einladen').click()
  await page.getByText(contactName).click()
  await page.getByText('1 einladen').click()
}

/**
 * Accept a space invite on the receiving side.
 * Waits for the invite dialog and clicks "Space öffnen".
 */
export async function acceptSpaceInvite(page: Page, timeout = 30_000): Promise<void> {
  await page.getByText('Einladung zu Space').waitFor({ timeout })
  await page.getByText('Space öffnen').click()
}

/**
 * Send a chat message in the currently open space.
 */
export async function sendMessage(page: Page, text: string): Promise<void> {
  const input = page.getByPlaceholder('Nachricht schreiben...')
  await input.fill(text)
  await input.press('Enter')
}

/**
 * Wait for a chat message to appear (CRDT sync).
 * Scoped to the chat area to avoid false matches with UI chrome.
 */
export async function expectMessage(page: Page, text: string | RegExp, timeout = 30_000): Promise<void> {
  // Chat messages are rendered as rounded divs inside the scrollable message area.
  // Use the input area as anchor — messages are above it in the same flex container.
  const chatArea = page.locator('.overflow-y-auto, [role="log"]').first()
  await expect(chatArea.getByText(text).first()).toBeVisible({ timeout })
}

/**
 * Assert the member count in the space detail header.
 */
export async function expectMemberCount(page: Page, count: number, timeout = 15_000): Promise<void> {
  const label = count === 1 ? '1 Person' : `${count} Personen`
  await expect(page.getByText(label).first()).toBeVisible({ timeout })
}

/**
 * Extract the space ID from the current page URL.
 */
function getSpaceId(page: Page): string {
  const url = page.url()
  const match = url.match(/\/chats\/([^/]+)/)
  if (!match) throw new Error(`Cannot extract spaceId from URL: ${url}`)
  return match[1]
}

/**
 * Remove a member from the space via the edit page.
 * Must be called while on the space detail page.
 */
export async function removeMember(page: Page): Promise<void> {
  const spaceId = getSpaceId(page)
  await navigateTo(page, `/chats/${spaceId}/edit`)
  await page.getByLabel('Mitglied entfernen').click()
  await page.waitForTimeout(2_000)
  await navigateTo(page, `/chats/${spaceId}`)
}
