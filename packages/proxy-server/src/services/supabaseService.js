/**
 * Supabase Service Layer
 * Provides normalized database operations for all admin entities
 * Handles error mapping, validation, and RLS policy enforcement
 */

const { createClient } = require('@supabase/supabase-js');

class SupabaseService {
  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.local'
      );
    }

    this.client = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Find all records from a table with optional filtering and pagination
   * @param {string} table - Table name
   * @param {Object} options - { filters: {}, page, limit, sortBy, sortOrder }
   * @returns {Promise<{data: Array, count: number, total: number}>}
   */
  async findAll(table, options = {}) {
    try {
      const { filters = {}, page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc' } = options;

      let query = this.client.from(table).select('*', { count: 'exact' });

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          query = query.eq(key, value);
        }
      });

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, count, error } = await query;

      if (error) {
        throw this._handleError(error);
      }

      return {
        data: data || [],
        count: data ? data.length : 0,
        total: count || 0,
      };
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Find a single record by ID
   * @param {string} table - Table name
   * @param {string} id - Record ID (UUID)
   * @returns {Promise<Object>}
   */
  async findById(table, id) {
    try {
      const { data, error } = await this.client
        .from(table)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found error
          const err = new Error(`${table} record not found`);
          err.statusCode = 404;
          throw err;
        }
        throw this._handleError(error);
      }

      return data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Create a new record
   * @param {string} table - Table name
   * @param {Object} payload - Record data
   * @param {string} userId - Current user ID (from auth context)
   * @returns {Promise<Object>}
   */
  async create(table, payload, userId) {
    try {
      // Tables that don't have created_by/updated_by columns
      const tablesWithoutMeta = ['attachments', 'complaint_participants'];
      
      const dataWithMeta = {
        ...payload,
        ...(tablesWithoutMeta.includes(table) ? {} : {
          created_by: userId && userId !== 'system' ? userId : null,
          updated_by: userId && userId !== 'system' ? userId : null,
        }),
        created_at: tablesWithoutMeta.includes(table) ? undefined : new Date().toISOString(),
        updated_at: tablesWithoutMeta.includes(table) ? undefined : new Date().toISOString(),
      };

      // Remove undefined values
      Object.keys(dataWithMeta).forEach(key => {
        if (dataWithMeta[key] === undefined) delete dataWithMeta[key];
      });

      const { data, error } = await this.client
        .from(table)
        .insert([dataWithMeta])
        .select('*')
        .single();

      if (error) {
        throw this._handleError(error);
      }

      return data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Update an existing record
   * @param {string} table - Table name
   * @param {string} id - Record ID
   * @param {Object} payload - Updated data
   * @param {string} userId - Current user ID
   * @returns {Promise<Object>}
   */
  async update(table, id, payload, userId) {
    try {
      console.log(`[SupabaseService.update] Table: ${table}, ID: ${id}`);
      console.log(`[SupabaseService.update] Incoming payload:`, payload);
      
      const dataWithMeta = {
        ...payload,
        updated_by: userId && userId !== 'system' ? userId : null,
        updated_at: new Date().toISOString(),
      };
      
      console.log(`[SupabaseService.update] Data to send to Supabase:`, dataWithMeta);
      if (dataWithMeta.initials) {
        console.log(`[SupabaseService.update] INITIALS VALUE: "${dataWithMeta.initials}" (length: ${dataWithMeta.initials.length})`);
      }

      const { data, error } = await this.client
        .from(table)
        .update(dataWithMeta)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error(`[SupabaseService.update] ERROR - Table: ${table}, Error code: ${error.code}, Message: ${error.message}`);
        if (error.code === 'PGRST116') {
          const err = new Error(`${table} record not found`);
          err.statusCode = 404;
          throw err;
        }
        throw this._handleError(error);
      }
      
      console.log(`[SupabaseService.update] Successfully updated record in ${table}`);

      return data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Delete a single record
   * @param {string} table - Table name
   * @param {string} id - Record ID
   * @returns {Promise<{id: string}>}
   */
  async delete(table, id) {
    try {
      const { data, error } = await this.client
        .from(table)
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          const err = new Error(`${table} record not found`);
          err.statusCode = 404;
          throw err;
        }
        throw this._handleError(error);
      }

      return { id: data.id };
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Delete multiple records by ID array
   * @param {string} table - Table name
   * @param {Array<string>} ids - Array of record IDs
   * @returns {Promise<{deleted: number}>}
   */
  async deleteMany(table, ids) {
    try {
      const { count, error } = await this.client
        .from(table)
        .delete()
        .in('id', ids);

      if (error) {
        throw this._handleError(error);
      }

      return { deleted: count || 0 };
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Search records by text search on multiple fields
   * @param {string} table - Table name
   * @param {string} searchTerm - Search term
   * @param {Array<string>} searchFields - Fields to search in
   * @returns {Promise<Array>}
   */
  async search(table, searchTerm, searchFields) {
    try {
      let query = this.client.from(table).select('*');

      if (searchTerm && searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        // Supabase doesn't have full-text search by default, so we filter client-side
        // For larger datasets, use PostgreSQL full-text search
        const { data, error } = await query;

        if (error) throw this._handleError(error);

        return (
          data?.filter((record) =>
            searchFields.some(
              (field) =>
                record[field] &&
                String(record[field]).toLowerCase().includes(term)
            )
          ) || []
        );
      }

      const { data, error } = await query;
      if (error) throw this._handleError(error);
      return data || [];
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Log an audit action
   * @param {Object} auditData - { userId, action, tableName, recordId, changes, ipAddress, userAgent }
   * @returns {Promise<void>}
   */
  async logAudit(auditData) {
    try {
      await this.client.from('audit_logs').insert([auditData]);
    } catch (error) {
      // Log audit failures to console but don't throw
      console.error('[AUDIT] Failed to log action:', error);
    }
  }

  /**
   * Map Postgres error codes to user-friendly messages
   * @param {Error} error - Supabase/Postgres error
   * @returns {Error}
   */
  _handleError(error) {
    console.error('[SUPABASE_ERROR]', error);

    const err = new Error();
    err.statusCode = 500;

    // PostgreSQL error codes
    if (error.code === '23505') {
      err.message = 'Duplicate entry. This record already exists.';
      err.statusCode = 409;
    } else if (error.code === '23503') {
      err.message = 'Invalid reference. A referenced record does not exist or the operation violates a relationship.';
      err.statusCode = 409;
    } else if (error.code === '42501') {
      err.message = 'Permission denied. You do not have access to this resource.';
      err.statusCode = 403;
    } else if (error.code === 'PGRST116') {
      err.message = 'Record not found.';
      err.statusCode = 404;
    } else if (error.message) {
      err.message = error.message;
    } else {
      err.message = 'An unexpected database error occurred.';
    }

    return err;
  }
}

module.exports = new SupabaseService();
