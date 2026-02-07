import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/shared/infrastructure/database/prisma.service';

/**
 * Search Results Interface
 */
export interface MessageSearchResult {
  id: string;
  conversationId: string;
  senderId: number;
  content: string | null;
  messageType: string;
  createdAt: Date;
  sender: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    businessName: string | null;
    profilePhoto: string | null;
  };
  highlights?: string[]; // Highlighted matching terms
}

/**
 * Search Pagination Meta
 */
export interface SearchMeta {
  query: string;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Message Search Service
 * SPEC-MSG-001 Phase 4
 * PostgreSQL full-text search with tsvector
 */
@Injectable()
export class MessageSearchService {
  private readonly logger = new Logger(MessageSearchService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Search messages in a conversation
   * Uses PostgreSQL full-text search with tsvector
   * NFR-MSG-USAB-003: Message search
   */
  async searchMessages(
    conversationId: string,
    userId: number,
    query: string,
    options: {
      page?: number;
      limit?: number;
      senderId?: number;
      startDate?: Date;
      endDate?: Date;
    } = {},
  ): Promise<{ data: MessageSearchResult[]; meta: SearchMeta }> {
    const { page = 1, limit = 20, senderId, startDate, endDate } = options;
    const skip = (page - 1) * limit;

    // Verify conversation access
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      throw new Error('You do not have access to this conversation');
    }

    // Build search query with tsvector
    const searchQuery = this.buildSearchQuery(query);

    // Count total matches
    const countResult = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM messages_new
      WHERE conversation_id = ${conversationId}
        AND is_archived = false
        AND search_text @@ ${searchQuery}
        ${senderId ? Prisma.sql`AND sender_id = ${senderId}` : Prisma.empty}
        ${startDate ? Prisma.sql`AND created_at >= ${startDate}` : Prisma.empty}
        ${endDate ? Prisma.sql`AND created_at <= ${endDate}` : Prisma.empty}
    `;

    const total = Number(countResult[0]?.count || 0);

    // Search with pagination
    const messages = await this.prisma.$queryRaw<
      Array<{
        id: string;
        conversation_id: string;
        sender_id: number;
        content: string | null;
        message_type: string;
        created_at: Date;
        first_name: string | null;
        last_name: string | null;
        business_name: string | null;
        profile_photo: string | null;
      }>
    >`
      SELECT
        m.id,
        m.conversation_id,
        m.sender_id,
        m.content,
        m.message_type,
        m.created_at,
        wp.first_name,
        wp.last_name,
        bp.business_name,
        wp.profile_photo
      FROM messages_new m
      LEFT JOIN worker_profiles wp ON m.sender_id = wp.user_id
      LEFT JOIN business_profiles bp ON m.sender_id = bp.user_id
      WHERE m.conversation_id = ${conversationId}
        AND m.is_archived = false
        AND m.search_text @@ ${searchQuery}
        ${senderId ? Prisma.sql`AND m.sender_id = ${senderId}` : Prisma.empty}
        ${startDate ? Prisma.sql`AND m.created_at >= ${startDate}` : Prisma.empty}
        ${endDate ? Prisma.sql`AND m.created_at <= ${endDate}` : Prisma.empty}
      ORDER BY ts_rank(m.search_text, ${searchQuery}) DESC, m.created_at DESC
      LIMIT ${limit}
      OFFSET ${skip}
    `;

    // Transform results and add highlights
    const results: MessageSearchResult[] = messages.map((msg) => ({
      id: msg.id,
      conversationId: msg.conversation_id,
      senderId: msg.sender_id,
      content: msg.content,
      messageType: msg.message_type,
      createdAt: msg.created_at,
      sender: {
        id: msg.sender_id,
        firstName: msg.first_name,
        lastName: msg.last_name,
        businessName: msg.business_name,
        profilePhoto: msg.profile_photo,
      },
      highlights: this.extractHighlights(msg.content || '', query),
    }));

    this.logger.log(`Search in conversation ${conversationId}: ${total} results for query "${query}"`);

    return {
      data: results,
      meta: {
        query,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Search all conversations for a user
   */
  async searchAllConversations(
    userId: number,
    query: string,
    options: {
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{ data: MessageSearchResult[]; meta: SearchMeta }> {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const searchQuery = this.buildSearchQuery(query);

    // Count total matches
    const countResult = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM messages_new m
      INNER JOIN conversations c ON m.conversation_id = c.id
      WHERE (c.user1_id = ${userId} OR c.user2_id = ${userId})
        AND c.status = 'ACTIVE'
        AND m.is_archived = false
        AND m.search_text @@ ${searchQuery}
    `;

    const total = Number(countResult[0]?.count || 0);

    // Search with pagination
    const messages = await this.prisma.$queryRaw<
      Array<{
        id: string;
        conversation_id: string;
        sender_id: number;
        content: string | null;
        message_type: string;
        created_at: Date;
        first_name: string | null;
        last_name: string | null;
        business_name: string | null;
        profile_photo: string | null;
      }>
    >`
      SELECT
        m.id,
        m.conversation_id,
        m.sender_id,
        m.content,
        m.message_type,
        m.created_at,
        wp.first_name,
        wp.last_name,
        bp.business_name,
        wp.profile_photo
      FROM messages_new m
      INNER JOIN conversations c ON m.conversation_id = c.id
      LEFT JOIN worker_profiles wp ON m.sender_id = wp.user_id
      LEFT JOIN business_profiles bp ON m.sender_id = bp.user_id
      WHERE (c.user1_id = ${userId} OR c.user2_id = ${userId})
        AND c.status = 'ACTIVE'
        AND m.is_archived = false
        AND m.search_text @@ ${searchQuery}
      ORDER BY ts_rank(m.search_text, ${searchQuery}) DESC, m.created_at DESC
      LIMIT ${limit}
      OFFSET ${skip}
    `;

    const results: MessageSearchResult[] = messages.map((msg) => ({
      id: msg.id,
      conversationId: msg.conversation_id,
      senderId: msg.sender_id,
      content: msg.content,
      messageType: msg.message_type,
      createdAt: msg.created_at,
      sender: {
        id: msg.sender_id,
        firstName: msg.first_name,
        lastName: msg.last_name,
        businessName: msg.business_name,
        profilePhoto: msg.profile_photo,
      },
      highlights: this.extractHighlights(msg.content || '', query),
    }));

    this.logger.log(`Global search for user ${userId}: ${total} results for query "${query}"`);

    return {
      data: results,
      meta: {
        query,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update search text for a message
   * Called when message is created or updated
   */
  async updateSearchText(messageId: string): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE messages_new
      SET search_text = to_tsvector('english', coalesce(content, ''))
      WHERE id = ${messageId}
    `;

    this.logger.debug(`Updated search text for message ${messageId}`);
  }

  /**
   * Build PostgreSQL tsvector search query
   */
  private buildSearchQuery(query: string): string {
    // Parse search query and convert to tsquery format
    const terms = query
      .trim()
      .split(/\s+/)
      .filter((term) => term.length > 0)
      .map((term) => {
        // Remove special characters and prefix with :* for prefix matching
        const cleaned = term.replace(/[^\w\s]/g, '');
        return `${cleaned}:*`;
      })
      .join(' & ');

    return terms;
  }

  /**
   * Extract highlighted snippets from content
   * Shows matching terms in context
   */
  private extractHighlights(content: string, query: string): string[] {
    if (!content || !query) {
      return [];
    }

    const terms = query.toLowerCase().split(/\s+/).filter((term) => term.length > 2);
    const highlights: string[] = [];

    // Find all occurrences and extract context
    for (const term of terms) {
      const regex = new RegExp(`(.{0,30})(${term})(.{0,30})`, 'gi');
      const matches = content.matchAll(regex);

      for (const match of matches) {
        const snippet = (match[0] || '').trim();
        if (snippet.length > 0) {
          highlights.push(snippet);
        }

        // Limit highlights per message
        if (highlights.length >= 3) {
          break;
        }
      }

      if (highlights.length >= 3) {
        break;
      }
    }

    return highlights;
  }

  /**
   * Get search statistics
   */
  async getSearchStats(): Promise<{ totalMessages: number; searchableMessages: number }> {
    const stats = await this.prisma.$queryRaw<Array<{ total: bigint; searchable: bigint }>>`
      SELECT
        COUNT(*) as total,
        COUNT(search_text) as searchable
      FROM messages_new
      WHERE is_archived = false
    `;

    return {
      totalMessages: Number(stats[0]?.total || 0),
      searchableMessages: Number(stats[0]?.searchable || 0),
    };
  }
}
