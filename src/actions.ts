import { Session } from './Session';

export type GoToFn = (state: string) => void

export type Action = (ctx: ActionContex) => Promise<void>

export type ActionContex = {
  session: Session,
  meta: any,
  data: any,
  goTo: GoToFn,
  isFinal: boolean,
}

export const askAction: Action = async (ctx) => {
  const { meta, session, data, goTo, isFinal } = ctx
  let { question } = meta
  question = t(question, data)
  
  const answer = await session.ask(question)
  data[meta.answerKey] = answer
  !isFinal && goTo(meta.next)
}

export const sendAction: Action = async (ctx) => {
  const { meta, session, data, goTo, isFinal } = ctx
  let { message } = meta
  message = t(message, data)

  await session.send(message)
  !isFinal && goTo(meta.next)
}

export const sendMenuAction: Action = async (ctx) => {
  const { meta, session, data, goTo } = ctx
  let { menu, message } = meta
  message = t(message, data)
  menu = t(menu, data)

  const reply = await session.menu(
    message,
    menu,
  )
  if (!menu.includes(reply)) {
    goTo('default')
    return
  }

  goTo(reply)
}

function t(template: string | ((data: Record<string, any>) => string), data: Record<string, any>) {
  let res = template
  if (typeof template === 'function') {
    res = template(data)
  }
  return res
}