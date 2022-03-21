import { Injector } from '@tanbo/di'
import { Plugin } from '@textbus/browser'
import { Editor } from '@textbus/editor'
import { Selection } from '@textbus/core'
import { Subscription } from '@tanbo/stream'

export class AutoSave implements Plugin {
  private event: Subscription = null

  setup(injector: Injector): void {
    const editor = injector.get(Editor)
    const selection = injector.get(Selection)
    this.event = editor.onChange.subscribe(() => { })
  }

  onDestroy(): void {
    this.event.unsubscribe()
  }
}