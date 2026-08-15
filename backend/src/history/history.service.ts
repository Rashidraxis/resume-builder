import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { promises as fs } from 'fs';
import { randomUUID } from 'crypto';
import { dirname, join } from 'path';
import { ResumeDto } from '../shared/resume.dto';

const MAX_ENTRIES = 3;
const DATA_FILE = join(process.cwd(), 'data', 'history.json');

export interface HistoryEntry {
  id: string;
  savedAt: string;
  name: string;
  resume: ResumeDto;
}

export type HistoryMeta = Omit<HistoryEntry, 'resume'>;

@Injectable()
export class HistoryService implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    await fs.mkdir(dirname(DATA_FILE), { recursive: true });
    try {
      await fs.access(DATA_FILE);
    } catch {
      await fs.writeFile(DATA_FILE, '[]', 'utf8');
    }
  }

  async list(): Promise<HistoryMeta[]> {
    const entries = await this.readAll();
    return entries.map(({ id, savedAt, name }) => ({ id, savedAt, name }));
  }

  async get(id: string): Promise<HistoryEntry> {
    const entries = await this.readAll();
    const found = entries.find(e => e.id === id);
    if (!found) throw new NotFoundException(`No history entry with id ${id}.`);
    return found;
  }

  async save(resume: ResumeDto): Promise<HistoryMeta> {
    const entry: HistoryEntry = {
      id: randomUUID(),
      savedAt: new Date().toISOString(),
      name: resume?.contact?.name?.trim() || 'Untitled',
      resume,
    };
    const existing = await this.readAll();
    const next = [entry, ...existing]
      .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
      .slice(0, MAX_ENTRIES);
    await this.writeAll(next);
    const { id, savedAt, name } = entry;
    return { id, savedAt, name };
  }

  async remove(id: string): Promise<void> {
    const entries = await this.readAll();
    const filtered = entries.filter(e => e.id !== id);
    if (filtered.length === entries.length) {
      throw new NotFoundException(`No history entry with id ${id}.`);
    }
    await this.writeAll(filtered);
  }

  private async readAll(): Promise<HistoryEntry[]> {
    try {
      const raw = await fs.readFile(DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private async writeAll(entries: HistoryEntry[]): Promise<void> {
    await fs.writeFile(DATA_FILE, JSON.stringify(entries, null, 2), 'utf8');
  }
}
