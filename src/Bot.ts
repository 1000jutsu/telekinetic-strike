import EventEmitter from 'events'
import { Telegraf, Markup } from 'telegraf'
import Dialog from './Dialog'
import { Session } from './Session'
import { Observable, filter, from, fromEvent, map } from 'rxjs'

class Bot {
  private onStartCb: (session: Session) => Promise<void> = null as any
  public updates: Observable<any>
  public messages: Observable<any>  

  constructor(public telegraf: Telegraf) {
    this.telegraf.start(this.userStarted)
    this.updates = fromEvent(this.updatesEmitter(), 'update')
    this.messages = this.updates.pipe(filter(u => u.message), map(u => u.message))
  }

  updatesEmitter() {
    const emitter = new EventEmitter()

    this.telegraf.on((() => true) as any,(ctx) => {
      emitter.emit('update', ctx.update)
    })
    return emitter
  }

  async sendTextMessage(userId: string, message: any): Promise<void> {
    await this.telegraf.telegram.sendMessage(userId, message)
  }

  async sendMenu(userId: string, message: string, buttons: string[]): Promise<void> {
    const menu = Markup.keyboard(buttons).oneTime().resize()
    await this.telegraf.telegram.sendMessage(userId, message, menu)
  }

  createSession(userId: string) {
    return new Session(this, userId);
  }

  private userStarted = (ctx: any) => {
    const { id, username } = ctx.update.message.from
    process.nextTick(() => {
      this.onStartCb(this.createSession(id))
    })
  }

  onStart(cb: (session: Session) => Promise<void>) {
    this.onStartCb = cb;
  }

  setStartDialog(dialogSimpleConfig: any) {
    this.onStart(async (session: Session) => {
      const dialog = Dialog.create(session, dialogSimpleConfig)
      await dialog.run()
      console.log('dialog done')
    })
  }

  async launch() {
    await this.telegraf.telegram.getMe(); 
    this.telegraf.launch().catch((err) => {
      console.error('Long polling error: ', err)
      process.exit(1)
    })
  }

  stop() {
    this.telegraf.stop('internal stop')
  }
}

export default Bot
