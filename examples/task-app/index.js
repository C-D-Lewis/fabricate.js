/**
 * When a task should be saved.
 *
 * @param {HTMLElement} input - Input containing the current value.
 */
const onSaveTask = (input) => {
  const { value } = input;
  if (value.trim().length === 0) return;

  // Add new item
  fab.update('tasks', (prev) => [...prev.tasks, value]);

  // Reset (TODO: Controlled input)
  input.value = '';
};

/**
 * Component to add a new task item.
 *
 * @returns {HTMLElement}
 */
const NewItemBox = () => {
  const icon = fab('Image', {
    src: './assets/pencil.png',
    width: '28px',
    height: '28px',
  })
    .setStyles({ padding: '10px' });

  const input = fab('TextInput', { placeholder: 'Create a new task...', backgroundColor: '#0000' })
    .setStyles({
      outline: 'none',
      width: '100%',
      marginRight: '15px',
      marginLeft: 'initial',
    });

  return fab('Card')
    .setStyles({ margin: 'auto', marginTop: '15px' })
    .setChildren([
      fab('Row')
        .setStyles({
          alignItems: 'center',
          maxWidth: '600px',
          minWidth: '500px',
          padding: '3px',
        })
        .setChildren([
          icon,
          input,
          fab('Button', { text: 'Create', backgroundColor: 'gold' })
            .setStyles({ minWidth: '50px' })
            .onClick(() => onSaveTask(input)),
        ]),
    ]);
};

/**
 * Component for each task item.
 *
 * @param {string} content - Content of the task.
 * @returns {HTMLElement}
 */
const TaskCard = (content) => fab('Card')
  .setStyles({
    backgroundColor: 'gold',
    color: 'black',
    margin: '10px',
  })
  .setChildren([
    fabricate('div')
      .setStyles({ padding: '15px', fontSize: '1.6rem' })
      .setText(content),

    fab('Button', {
      text: 'Delete',
      color: 'white',
      backgroundColor: 'darkred',
    })
      .setStyles({ minWidth: '50px', padding: '5px' })
      .onClick(() => {
        // Remove the item
        fab.update('tasks', ({ tasks }) => tasks.filter((p) => p !== content));
      }),
  ]);

/**
 * Component to view all existing tasks.
 *
 * @returns {HTMLElement}
 */
const TaskList = () => fab('Row')
  .setStyles({ padding: '10px', flexWrap: 'wrap' })
  .onUpdate((el, state) => {
    el.setChildren(state.tasks.map(TaskCard));
  }, ['fabricate:init', 'tasks']);

/**
 * App component.
 *
 * @returns {HTMLElement}
 */
const App = () => fab('Column')
  .setChildren([
    fab('NavBar', {
      title: 'Task List Example',
      color: 'white',
      backgroundColor: 'gold',
    }),
    NewItemBox(),
    TaskList(),
  ]);

// Start app
const initialState = {
  tasks: ['Take out the tash before going out'],
};
const options = { persistState: ['tasks'] };
fabricate.app(App(), initialState, options);
