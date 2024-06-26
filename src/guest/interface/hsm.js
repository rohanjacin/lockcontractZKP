function createMachine(stateMachineDefinition) {

  const machine = {

    value: stateMachineDefinition.initialState,

    transition(currentState, event) {

      const currentStateDefinition = stateMachineDefinition[currentState]

      const destinationTransition = currentStateDefinition.transitions[event]

      if (!destinationTransition) {

        return

      }

      const destinationState = destinationTransition.target

      const destinationStateDefinition =

        stateMachineDefinition[destinationState]

      destinationTransition.action()

      currentStateDefinition.actions.onExit()

      destinationStateDefinition.actions.onEnter()

      machine.value = destinationState

      return machine.value

    },

  }

  return machine

}

module.exports.createMachine = createMachine;