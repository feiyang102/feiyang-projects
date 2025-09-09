import type { VNode } from 'vue'

export default function createReuseableTemplate() {
  let render: () => VNode
  const DefineTemplate = {
    setup(_, { slots }) {
      return () => {
        render = slots.default
      }
    },
  }
  const UseTemplate = (props) => render(props)
  // const UseTemplate = (props) => {
  //   console.log('UseTemplate props', props)
  //   return render(props)
  // }
  return [DefineTemplate, UseTemplate]
}
