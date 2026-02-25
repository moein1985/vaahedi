import { describe, it, expect, beforeEach } from 'vitest';
import { createAuthenticatedContext } from '../../../../test/test-context.js';
import { chatRouter } from '../chat.router.js';
import { userChatRouter } from '../userChat.router.js';
import { createTestUser } from '@repo/db/test-utils';
import { prisma } from '@repo/db';

const aiCaller = chatRouter.createCaller;
const userChatCaller = userChatRouter.createCaller;

describe('User Chat Router', () => {
  let ctx: any;
  let user: any;
  let otherUser: any;

  beforeEach(async () => {
    user = await createTestUser(prisma);
    otherUser = await createTestUser(prisma);
    ctx = {
      db: prisma,
      req: { headers: {}, ip: '127.0.0.1', cookies: {} },
      res: { setCookie: () => {}, clearCookie: () => {} },
      cache: null,
      storage: null,
      ai: null,
      user,
    };
  });

  describe('newConversation', () => {
    it('should create conversation', async () => {
      const result = await userChatCaller(ctx).newConversation({
        participantUserCode: otherUser.userCode,
      });

      expect(result).toHaveProperty('id');
    });

    it('should not create duplicate conversation', async () => {
      await userChatCaller(ctx).newConversation({
        participantUserCode: otherUser.userCode,
      });

      const result = await userChatCaller(ctx).newConversation({
        participantUserCode: otherUser.userCode,
      });

      expect(result).toHaveProperty('id');
      expect(result.isNew).toBe(false);
    });
  });

  describe('sendMessage', () => {
    let conversation: any;

    beforeEach(async () => {
      conversation = await userChatCaller(ctx).newConversation({
        participantUserCode: otherUser.userCode,
      });
    });

    it('should send message', async () => {
      const result = await userChatCaller(ctx).sendMessage({
        conversationId: conversation.id,
        content: 'Hello!',
      });

      expect(result).toHaveProperty('id');
      expect(result.content).toBe('Hello!');
      expect(result.sender.userCode).toBe(user.userCode);
    });

    it('should validate conversation exists', async () => {
      await expect(
        userChatCaller(ctx).sendMessage({
          conversationId: 'nonexistent',
          content: 'Hello!',
        })
      ).rejects.toThrow();
    });
  });

  describe('getMessages', () => {
    let conversation: any;

    beforeEach(async () => {
      conversation = await userChatCaller(ctx).newConversation({
        participantUserCode: otherUser.userCode,
      });
      await userChatCaller(ctx).sendMessage({
        conversationId: conversation.id,
        content: 'Test message',
      });
    });

    it('should get messages', async () => {
      const result = await userChatCaller(ctx).getMessages({
        conversationId: conversation.id,
      });

      expect(result).toHaveLength(1);
      expect(result[0]!.content).toBe('Test message');
      expect(result[0]!.sender.userCode).toBe(user.userCode);
    });
  });

  describe('listConversations', () => {
    beforeEach(async () => {
      await userChatCaller(ctx).newConversation({
        participantUserCode: otherUser.userCode,
      });
    });

    it('should get user conversations', async () => {
      const result = await userChatCaller(ctx).listConversations();

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('participants');
    });
  });
});