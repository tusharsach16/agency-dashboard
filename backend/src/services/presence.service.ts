class PresenceService {
  private userSockets: Map<string, Set<string>> = new Map();

  public addSocket(userId: string, socketId: string): { countChanged: boolean; currentCount: number } {
    const existing = this.userSockets.get(userId);
    if (!existing) {
      this.userSockets.set(userId, new Set([socketId]));
      return { countChanged: true, currentCount: this.userSockets.size };
    }
    existing.add(socketId);
    return { countChanged: false, currentCount: this.userSockets.size };
  }

  public removeSocket(userId: string, socketId: string): { countChanged: boolean; currentCount: number } {
    const existing = this.userSockets.get(userId);
    if (!existing) {
      return { countChanged: false, currentCount: this.userSockets.size };
    }
    existing.delete(socketId);
    if (existing.size === 0) {
      this.userSockets.delete(userId);
      return { countChanged: true, currentCount: this.userSockets.size };
    }
    return { countChanged: false, currentCount: this.userSockets.size };
  }

  public getOnlineUserCount(): number {
    return this.userSockets.size;
  }

  public isUserOnline(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return Boolean(sockets && sockets.size > 0);
  }

  public clear(): void {
    this.userSockets.clear();
  }
}

export const presenceService = new PresenceService();
