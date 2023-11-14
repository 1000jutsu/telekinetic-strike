import test from 'node:test';
import { Action } from '../src/actions';
import { parseSimpleConfig } from '../src/Dialog';

const users = []
const saveName: Action = async (session, meta, data, goTo) => {
  users.push({
    id: session.userId,
    name: data.name
  })
  goTo('greet')
}

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
    saveName
  },

  greet: {
    send: {
      message: (data: any) => `Greetings ${data.name}`
    },
    final: true
  }
}

test('Test Dialog', async t => {
  await t.test('Test parseSimpleConfig', t => {
    console.log(JSON.stringify(parseSimpleConfig(simpleConfig), null, '  '))
  })
})