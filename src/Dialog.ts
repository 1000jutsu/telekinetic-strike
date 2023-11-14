import {
  interpret,
  AnyInterpreter,
  InterpreterOptions,
  AnyStateMachine,
  createMachine,
  Machine
 } from "xstate"
import { Session } from "./Session"
import _, { startCase } from 'lodash'
import { toStatePaths } from "xstate/lib/utils"
import { Action, askAction, sendAction, sendMenuAction } from './actions'

class Dialog<DataType extends Record<string, any>> {
  protected machine: AnyStateMachine = null as any
  protected service: AnyInterpreter = null as any
  protected actions: Record<string, Action> = {}
  protected end: Promise<any> = null as any
  protected data: DataType = {} as DataType

  constructor(public session: Session, private machineConfig: any) {
    this.addAction('send', sendAction)
    this.addAction('sendMenu', sendMenuAction)
    this.addAction('ask', askAction)
  }

  static create<DataType extends Record<string, any>>(session: Session, simpleConfig: any) {
    const { config, actions } = parseSimpleConfig(simpleConfig)
    const dialog = new Dialog<DataType>(session, config)
    for (const actionName in actions) {
      dialog.addAction(actionName, actions[actionName])
    }
    return dialog
  }

  addAction(key: string, fn: Action) {
    const goTo = ((state: string) => {
      process.nextTick(() => this.service.send(state))
    })

    this.actions[key] = async () => {
      await fn({
        session: this.session,
        meta: this.getMeta(),
        data: this.data, 
        goTo: goTo.bind(this),
        isFinal: this.isFinal()
      })
    }
    this.actions[key] = this.actions[key].bind(this)
  }

  private init() {
    this.machine = createMachine(_.cloneDeep(this.machineConfig), {
      actions: this.actions as any
    })
    this.service = interpret(this.machine)
  }

  private start() {
    this.end = new Promise((resolve, reject) => {
      this.service.onDone(() => {
        resolve(this.data)
      })
      this.service.onStop(() => {
        reject('Machine is stopped before done')
      })
    })
    this.service.start()
  }

  async run(): Promise<DataType> {
    this.init()
    this.start()
    await this.end
    return this.data
  }

  private getStateNode() {
    return this.machine.getStateNode(this.service.state.value as string)
  }

  private getMeta() {
    return this.getStateNode().meta
  }

  private isFinal() {
    return this.getStateNode().type === 'final'
  }
}

export default Dialog

export function parseSimpleConfig(simpleConfig: any) {
  const config = {
    id: simpleConfig.name,
    initial: 'start',
    states: {}
  } as any
  const allActions = {} as any

  Object.getOwnPropertyNames(simpleConfig)
    .filter(k => k !== 'name')
    .forEach(state => {
      const { state: parsedState, actions } = parseSimpleState(simpleConfig[state]) 
      config.states[state] = parsedState
      Object.assign(allActions, actions)
    })

  Object.getOwnPropertyNames(config.states)
    .forEach(state => {
      Object.assign(config.states[state].on,
        _.fromPairs(Object.getOwnPropertyNames(config.states)
          .filter(s => s!==state)
          .map(s => ([s, s]))
        )
      )
    })

  return {config, actions: allActions}
}

export function parseSimpleState(state: any) {
  const res = {
    meta: {},
    entry: [],
    on: {}
  } as any

  if (Object.hasOwn(state, 'final')) {
    res.type = 'final'
  }

  if (Object.hasOwn(state, 'send')) {
    res.entry.push('send')
    res.meta.message = state.send.message
    res.meta.next = state.send.next
  }

  if (Object.hasOwn(state, 'sendMenu')) {
    res.entry.push('sendMenu')
    res.meta.message = state.sendMenu.message
    res.meta.menu = state.sendMenu.menu
  }

  if (Object.hasOwn(state, 'ask')) {
    res.entry.push('ask')
    res.meta.question = state.ask.question
    res.meta.answerKey = state.ask.answerKey
    res.meta.next = state.ask.next
  }

  if (Object.hasOwn(state, 'on')) {
    res.on = state.on
  }

  const reservedKeys = ['send', 'sendMenu', 'ask', 'goNext', 'on', 'final']
  const actions = Object.getOwnPropertyNames(state)
    .filter(k => !reservedKeys.includes(k))
    .filter(k => typeof state[k] === 'function')
  actions.forEach(a => res.entry.push(a))

  if (Object.hasOwn(state, 'goNext')) {
    res.entry.push('goNext')
    res.on.next = state.goNext
  }

  return {
    state: res,
    actions: _.pick(state, actions),
  }
}

// Simple config example
const simpleConfig = {
  name: 'helloDialog',

  start: {
    send: {
      message: 'Hello!'
    },
    goNext: 'enterName',
  },

  enterName: {
    ask: {
      question: 'Enter your name',
      answerKey: 'name'
    },
    // @ts-ignore
    saveName: async (session, meta, data, goTo) => {
      // @ts-ignore
      globalThis.users.push({
        id: session.userId,
        name: data.name
      })
      goTo('done')
    },
    on: {
      done: 'greet'
    }
  },

  greet: {
    send: {
      message: (data: any) => `Greetings ${data.name}`
    },
    final: true
  }
}