const {
  app, updateState, getState,
  Column, Row, NavBar, Image, TextInput, Button, Card,
} = fabricate;

/**
 * Load saved tasks or use default.
 *
 * @returns {Array<string>} Loaded tasks.
 */
const loadTasksFromStorage = () => {
  const loaded = localStorage.getItem('tasks');
  return loaded !== null ? JSON.parse(loaded) : ['Take out the trash before going to work'];
};

/**
 * Save tasks to localStorage.
 */
const saveTasksToStorage = () => localStorage.setItem('tasks', JSON.stringify(getState('tasks')));

/**
 * When a task should be saved.
 *
 * @param {HTMLElement} input - Input containing the current value. TODO: Use updateState instead.
 */
const onSaveTask = (input) => {
  const { value } = input;
  if (value.trim().length === 0) return;

  // Add new item
  updateState('tasks', (state) => [...state.tasks, value]);

  // Reset
  input.value = '';
  updateState('nextItem', () => '');

  // Save app state
  saveTasksToStorage();
};

/**
 * Component to add a new task item.
 *
 * @returns {HTMLElement}
 */
const NewItemBox = () => {
  const icon = Image({
    src: './assets/pencil.png',
    width: '28px',
    height: '28px',
  })
    .withStyles({ padding: '10px' });

  const input = TextInput({
    placeholder: 'Create a new task...',
    backgroundColor: '#0000',
  })
    .withStyles({
      outline: 'none',
      width: '100%',
      marginRight: '15px',
      marginLeft: 'initial',
    });

  return Row()
    .withStyles({
      margin: '20px auto',
      border: 'solid 1px #3333',
      borderRadius: '15px',
      alignItems: 'center',
      maxWidth: '600px',
      width: '90%',
      padding: '3px',
    })
    .withChildren([
      icon,
      input,
      Button({ text: 'Create', backgroundColor: 'gold' })
        .withStyles({ minWidth: '50px' })
        .onClick(() => onSaveTask(input)),
    ]);
};

/**
 * Component for each task item.
 *
 * @param {string} content - Content of the task.
 * @returns {HTMLElement}
 */
const TaskItem = (content) => Card()
  .withStyles({
    backgroundColor: 'gold',
    color: 'black',
    margin: '10px',
  })
  .withChildren([
    fabricate('div')
      .withStyles({ padding: '15px', fontSize: '1.6rem' })
      .setText(content),

    Button({
      text: 'Delete',
      color: 'white',
      backgroundColor: 'darkred',
    })
      .withStyles({ minWidth: '50px', padding: '5px' })
      .onClick(() => {
        // Remove the item
        updateState('tasks', ({ tasks }) => tasks.filter((p) => p !== content));

        // Save app state
        saveTasksToStorage();
      }),
  ]);

/**
 * Component to view all existing tasks.
 *
 * @returns {HTMLElement}
 */
const TaskList = () => Row()
  .withStyles({ padding: '10px', flexWrap: 'wrap' })
  .watchState((el, state) => {
    el.clear();
    el.addChildren(state.tasks.map(TaskItem));
  });

/**
 * The main function.
 */
const main = () => {
  const pageContainer = Column()
    .withChildren([
      NavBar({
        title: 'Task List Example',
        color: 'white',
        backgroundColor: 'gold',
      }),
      NewItemBox(),
      TaskList(),
    ]);

  // Start app
  const initialState = {
    tasks: loadTasksFromStorage(),
  };
  app(pageContainer, initialState);
};

main();
