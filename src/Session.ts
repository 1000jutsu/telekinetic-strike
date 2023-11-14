import { Observable, filter, firstValueFrom, map } from 'rxjs'
import Bot from "./Bot"

export class Session {
  private input: Observable<any>

  constructor(public bot: Bot, public userId: string) {
    this.input = this.bot.messages.pipe(filter(m => m.from.id === userId))
  }

  public async send(message: any, ...args: any[]): Promise<void> {
    await this.bot.sendTextMessage(this.userId, message)
  }

  public async ask(message: any, ...args: any[]): Promise<string> {
    await this.bot.sendTextMessage(this.userId, message)
    const m = await this.nextTextMessage()
    return m
  }

  public async menu(text: string, buttons: string[]): Promise<string> {
    await this.bot.sendMenu(this.userId, text, buttons)
    return await this.nextTextMessage()
  }

  public async nextMessage(filter: any): Promise<any> {
    return await firstValueFrom(this.input.pipe(filter()));
  }

  public async nextTextMessage(): Promise<string> {
    return await firstValueFrom(this.input.pipe(map(m => m.text)));
  }

  close() {
    this.input = null as any;
  }
}
