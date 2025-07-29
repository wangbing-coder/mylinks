import { createClient } from "@libsql/client";

// 创建 Turso 数据库客户端
export const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

// 数据库操作辅助函数
export class TursoHelper {
  // 初始化数据库表
  static async initializeTables() {
    try {
      // 创建分组表
      await turso.execute(`
        CREATE TABLE IF NOT EXISTS groups (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          description TEXT,
          color TEXT DEFAULT '#3b82f6',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 创建项目表
      await turso.execute(`
        CREATE TABLE IF NOT EXISTS projects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          description TEXT,
          group_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE SET NULL
        )
      `);

      // 创建反向链接表
      await turso.execute(`
        CREATE TABLE IF NOT EXISTS backlinks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id INTEGER,
          source_url TEXT NOT NULL,
          source_domain TEXT NOT NULL,
          target_url TEXT NOT NULL,
          page_ascore INTEGER,
          external_links INTEGER,
          is_nofollow BOOLEAN,
          first_seen DATE,
          last_seen DATE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
        )
      `);

      // 创建每日URL跟踪表
      await turso.execute(`
        CREATE TABLE IF NOT EXISTS daily_urls (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          url TEXT NOT NULL,
          domain TEXT,
          date DATE NOT NULL,
          type TEXT DEFAULT 'url' CHECK (type IN ('url', 'better_link')),
          tag TEXT DEFAULT 'nav' CHECK (tag IN ('nav', 'blog', 'profile', 'other')),
          comment TEXT,
          color TEXT DEFAULT 'green' CHECK (color IN ('green', 'blue', 'red', 'yellow', 'purple', 'gray')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('数据库表初始化成功');
      return { success: true, message: '数据库表初始化成功' };
    } catch (error) {
      console.error('数据库表初始化失败:', error);
      return { success: false, message: '数据库表初始化失败', error };
    }
  }

  // 分组管理方法
  static async createGroup(name: string, description?: string, color?: string) {
    try {
      const result = await turso.execute({
        sql: 'INSERT INTO groups (name, description, color) VALUES (?, ?, ?)',
        args: [name, description || '', color || '#3b82f6']
      });
      return { 
        success: true, 
        data: { 
          id: Number(result.lastInsertRowid), 
          name, 
          description: description || '', 
          color: color || '#3b82f6' 
        } 
      };
    } catch (error: any) {
      console.error('创建分组失败:', error);
      if (error.code === 'SQLITE_CONSTRAINT' && error.message?.includes('UNIQUE constraint failed: groups.name')) {
        return { success: false, message: '分组名称已存在，请使用其他名称', error };
      }
      return { success: false, message: '创建分组失败', error };
    }
  }

  static async getAllGroups() {
    try {
      const result = await turso.execute(`
        SELECT 
          g.*,
          COUNT(p.id) as projects_count
        FROM groups g
        LEFT JOIN projects p ON g.id = p.group_id
        GROUP BY g.id
        ORDER BY g.created_at DESC
      `);
      return { success: true, data: result.rows };
    } catch (error) {
      console.error('查询分组失败:', error);
      return { success: false, message: '查询分组失败', error };
    }
  }

  static async updateGroup(id: number, name: string, description?: string, color?: string) {
    try {
      await turso.execute({
        sql: 'UPDATE groups SET name = ?, description = ?, color = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        args: [name, description || '', color || '#3b82f6', id]
      });
      return { success: true, message: '分组更新成功' };
    } catch (error) {
      console.error('更新分组失败:', error);
      return { success: false, message: '更新分组失败', error };
    }
  }

  static async deleteGroup(id: number) {
    try {
      // 先将该分组下的项目的group_id设为NULL
      await turso.execute({
        sql: 'UPDATE projects SET group_id = NULL WHERE group_id = ?',
        args: [id]
      });
      
      // 删除分组
      await turso.execute({
        sql: 'DELETE FROM groups WHERE id = ?',
        args: [id]
      });
      
      return { success: true, message: '分组删除成功' };
    } catch (error) {
      console.error('删除分组失败:', error);
      return { success: false, message: '删除分组失败', error };
    }
  }

  // 测试数据库连接
  static async testConnection() {
    try {
      const result = await turso.execute('SELECT 1 as test');
      console.log('数据库连接测试成功');
      return { success: true, message: '数据库连接成功', data: result };
    } catch (error) {
      console.error('数据库连接测试失败:', error);
      return { success: false, message: '数据库连接失败', error };
    }
  }

  // 插入测试数据
  static async insertTestData() {
    try {
      // 插入测试反向链接数据
      await turso.execute({
        sql: `INSERT INTO backlinks (source_url, target_url, domain, anchor_text, follow_status, authority_score, first_seen, last_seen) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          'https://example.com/page1',
          'https://target-site.com',
          'example.com',
          '测试锚文本',
          'follow',
          85,
          '2024-01-01',
          '2024-01-15'
        ]
      });

      // 插入测试引荐域名数据
      await turso.execute({
        sql: `INSERT OR IGNORE INTO referring_domains (domain, authority_score, backlinks_count, first_seen, last_seen) 
              VALUES (?, ?, ?, ?, ?)`,
        args: [
          'example.com',
          85,
          5,
          '2024-01-01',
          '2024-01-15'
        ]
      });

      console.log('测试数据插入成功');
      return { success: true, message: '测试数据插入成功' };
    } catch (error) {
      console.error('测试数据插入失败:', error);
      return { success: false, message: '测试数据插入失败', error };
    }
  }

  // 查询所有反向链接
  static async getAllBacklinks() {
    try {
      const result = await turso.execute('SELECT * FROM backlinks ORDER BY created_at DESC');
      return { success: true, data: result.rows };
    } catch (error) {
      console.error('查询反向链接失败:', error);
      return { success: false, message: '查询反向链接失败', error };
    }
  }



  // 创建或获取项目
  static async createOrGetProject(name: string, description?: string, groupId?: number) {
    try {
      // 先尝试获取现有项目（在指定组内查找）
      const existingProject = await turso.execute({
        sql: 'SELECT * FROM projects WHERE name = ? AND group_id = ?',
        args: [name, groupId || null]
      });

      if (existingProject.rows.length > 0) {
        return { success: true, data: existingProject.rows[0] };
      }

      // 创建新项目
      const result = await turso.execute({
        sql: 'INSERT INTO projects (name, description, group_id) VALUES (?, ?, ?) RETURNING *',
        args: [name, description || '', groupId || null]
      });

      // 转换BigInt为Number
      const projectData = result.rows[0] as any;
      if (projectData && typeof projectData.id === 'bigint') {
        projectData.id = Number(projectData.id);
      }

      return { success: true, data: projectData };
    } catch (error) {
      console.error('创建项目失败:', error);
      return { success: false, error };
    }
  }

  // 获取所有项目
  static async getAllProjects() {
    try {
      const result = await turso.execute(`
        SELECT 
          p.*,
          g.name as group_name,
          g.color as group_color,
          COUNT(b.id) as backlinks_count,
          AVG(b.page_ascore) as avg_authority,
          SUM(CASE WHEN b.is_nofollow = 0 THEN 1 ELSE 0 END) as follow_links_count
        FROM projects p
        LEFT JOIN groups g ON p.group_id = g.id
        LEFT JOIN backlinks b ON p.id = b.project_id
        GROUP BY p.id
        ORDER BY g.name ASC, p.created_at DESC
      `);
      return { success: true, data: result.rows };
    } catch (error) {
      console.error('查询项目失败:', error);
      return { success: false, message: '查询项目失败', error };
    }
  }

  // 删除项目及其所有相关数据
  static async deleteProject(projectId: number) {
    try {
      // 首先删除所有相关的反向链接
      await turso.execute({
        sql: 'DELETE FROM backlinks WHERE project_id = ?',
        args: [projectId]
      });

      // 然后删除项目本身
      const result = await turso.execute({
        sql: 'DELETE FROM projects WHERE id = ?',
        args: [projectId]
      });

      return { success: true, message: 'Project and all related data deleted successfully' };
    } catch (error) {
      console.error('Failed to delete project:', error);
      return { success: false, message: 'Failed to delete project', error };
    }
  }

  // 根据项目ID获取反向链接
  static async getBacklinksByProject(projectId: number) {
    try {
      const result = await turso.execute({
        sql: 'SELECT * FROM backlinks WHERE project_id = ? ORDER BY created_at DESC',
        args: [projectId]
      });
      return { success: true, data: result.rows };
    } catch (error) {
      console.error('查询项目反向链接失败:', error);
      return { success: false, message: '查询项目反向链接失败', error };
    }
  }

  // 插入反向链接数据
  static async insertBacklink(data: {
    project_id?: number
    source_url: string
    source_domain: string
    target_url: string
    page_ascore: number
    external_links: number
    is_nofollow: boolean
    first_seen: string
    last_seen: string
  }) {
    try {
      await turso.execute({
        sql: `INSERT INTO backlinks 
              (project_id, source_url, source_domain, target_url, page_ascore, external_links, is_nofollow, first_seen, last_seen) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          data.project_id || null,
          data.source_url,
          data.source_domain,
          data.target_url,
          data.page_ascore,
          data.external_links,
          data.is_nofollow,
          data.first_seen,
          data.last_seen
        ]
      });
      return { success: true };
    } catch (error) {
      console.error('插入反向链接失败:', error);
      return { success: false, error };
    }
  }

  // 插入引荐域名数据
  static async insertReferringDomain(data: {
    domain: string
    authority_score: number
    backlinks_count: number
    first_seen: string
    last_seen: string
  }) {
    try {
      await turso.execute({
        sql: `INSERT OR REPLACE INTO referring_domains 
              (domain, authority_score, backlinks_count, first_seen, last_seen) 
              VALUES (?, ?, ?, ?, ?)`,
        args: [
          data.domain,
          data.authority_score,
          data.backlinks_count,
          data.first_seen,
          data.last_seen
        ]
      });
      return { success: true };
    } catch (error) {
      console.error('插入引荐域名失败:', error);
      return { success: false, error };
    }
  }

  // 清空测试数据
  static async clearTestData() {
    try {
      await turso.execute('DELETE FROM backlinks');
      await turso.execute('DELETE FROM referring_domains');
      console.log('测试数据清空成功');
      return { success: true, message: '测试数据清空成功' };
    } catch (error) {
      console.error('测试数据清空失败:', error);
      return { success: false, message: '测试数据清空失败', error };
    }
  }

  // 每日URL管理方法
  static async addDailyUrl(url: string, date?: string, comment?: string, type: 'url' | 'better_link' = 'url', tag: 'nav' | 'blog' | 'profile' | 'other' = 'nav', color: 'green' | 'blue' | 'red' | 'yellow' | 'purple' | 'gray' = 'green') {
    try {
      const submitDate = date || new Date().toISOString().split('T')[0];
      
      // 提取域名
      let domain: string | null = null;
      try {
        const urlObj = new URL(url);
        domain = urlObj.hostname.replace(/^www\./, ''); // 去掉 www 前缀
      } catch (error) {
        console.warn('Failed to extract domain from URL:', url, error);
      }
      
      const result = await turso.execute({
        sql: 'INSERT INTO daily_urls (url, domain, date, type, tag, comment, color) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [url, domain, submitDate, type, tag, comment || null, color]
      });
      return { success: true, data: result };
    } catch (error) {
      console.error('Failed to add daily URL:', error);
      return { success: false, error };
    }
  }

  static async getDailyUrls(date?: string, type?: 'url' | 'better_link', tag?: 'nav' | 'blog' | 'profile' | 'other') {
    try {
      let sql = 'SELECT * FROM daily_urls';
      let args: any[] = [];
      let conditions: string[] = [];
      
      if (date) {
        conditions.push('date = ?');
        args.push(date);
      }
      
      if (type) {
        conditions.push('type = ?');
        args.push(type);
      }
      
      if (tag) {
        conditions.push('tag = ?');
        args.push(tag);
      }
      
      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }
      
      sql += ' ORDER BY tag, created_at DESC';
      
      const result = await turso.execute({
        sql,
        args
      });
      return { success: true, data: result.rows };
    } catch (error) {
      console.error('Failed to get daily URLs:', error);
      return { success: false, error };
    }
  }

  static async getDailyUrlByUrl(url: string) {
    try {
      const result = await turso.execute({
        sql: 'SELECT * FROM daily_urls WHERE url = ? LIMIT 1',
        args: [url]
      });
      return { success: true, data: result.rows[0] || null };
    } catch (error) {
      console.error('Failed to get daily URL by URL:', error);
      return { success: false, error };
    }
  }

  static async updateDailyUrl(id: number, updates: { comment?: string; color?: 'green' | 'blue' | 'red' | 'yellow' | 'purple' | 'gray'; tag?: 'nav' | 'blog' | 'profile' | 'other' }) {
    try {
      const setParts: string[] = [];
      const args: any[] = [];
      
      if (updates.comment !== undefined) {
        setParts.push('comment = ?');
        args.push(updates.comment);
      }
      
      if (updates.color) {
        setParts.push('color = ?');
        args.push(updates.color);
      }
      
      if (updates.tag) {
        setParts.push('tag = ?');
        args.push(updates.tag);
      }
      
      if (setParts.length === 0) {
        return { success: false, error: 'No updates provided' };
      }
      
      args.push(id);
      
      const result = await turso.execute({
        sql: `UPDATE daily_urls SET ${setParts.join(', ')} WHERE id = ?`,
        args
      });
      
      return { success: true, data: result };
    } catch (error) {
      console.error('Failed to update daily URL:', error);
      return { success: false, error };
    }
  }

  static async deleteDailyUrl(id: number) {
    try {
      const result = await turso.execute({
        sql: 'DELETE FROM daily_urls WHERE id = ?',
        args: [id]
      });
      return { success: true, data: result };
    } catch (error) {
      console.error('Failed to delete daily URL:', error);
      return { success: false, error };
    }
  }

  static async getDailyUrlStats(type?: 'url' | 'better_link') {
    try {
      let sql = `
        SELECT 
          date,
          COUNT(*) as count
        FROM daily_urls
      `;
      
      if (type) {
        sql += ` WHERE type = '${type}'`;
      }
      
      sql += `
        GROUP BY date
        ORDER BY date DESC
        LIMIT 30
      `;
      
      const result = await turso.execute(sql);
      return { success: true, data: result.rows };
    } catch (error) {
      console.error('Failed to get daily URL stats:', error);
      return { success: false, error };
    }
  }

  // 为现有记录迁移域名数据
  static async migrateDomainData() {
    try {
      // 获取所有没有域名的记录
      const result = await turso.execute({
        sql: 'SELECT id, url FROM daily_urls WHERE domain IS NULL',
        args: []
      });

      for (const row of result.rows) {
        const id = row.id;
        const url = row.url as string;
        
        // 提取域名
        try {
          const urlObj = new URL(url);
          const domain = urlObj.hostname.replace(/^www\./, '');
          
          // 更新记录
          await turso.execute({
            sql: 'UPDATE daily_urls SET domain = ? WHERE id = ?',
            args: [domain, id]
          });
        } catch (error) {
          console.warn(`Failed to extract domain from URL: ${url}`, error);
        }
      }
      
      console.log(`Migrated domain data for ${result.rows.length} records`);
      return { success: true };
    } catch (error) {
      console.error('Failed to migrate domain data:', error);
      return { success: false, error };
    }
  }

  // 检查 better link 在反向链接中匹配的项目数量
  static async checkBacklinkProjects(domain: string) {
    try {
      const result = await turso.execute({
        sql: `
          SELECT 
            COUNT(DISTINCT b.project_id) as project_count,
            COUNT(b.id) as backlink_count
          FROM backlinks b
          WHERE b.source_domain = ? 
             OR b.source_domain = ? 
             OR b.source_domain LIKE ?
             OR b.source_domain LIKE ?
        `,
        args: [domain, `www.${domain}`, `%.${domain}`, `www.%.${domain}`]
      });
      
      const row = result.rows[0] as any;
      return { 
        success: true, 
        data: {
          projectCount: Number(row?.project_count || 0),
          backlinkCount: Number(row?.backlink_count || 0)
        }
      };
    } catch (error) {
      console.error('Failed to check backlink projects:', error);
      return { success: false, error };
    }
  }
} 