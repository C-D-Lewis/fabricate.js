/**
 * Component to add a new task item.
 *
 * @returns {HTMLElement} Fabricate component.
 */
const NewItemBox = () => {
  const icon = fabricate('Image', { src: './assets/pencil.png' })
    .setStyles({
      padding: '10px',
      width: '28px',
      height: '28px',
    });

  const input = fabricate('TextInput', { placeholder: 'Create a new task...', backgroundColor: '#0000' })
    .setStyles({
      outline: 'none',
      width: '100%',
      marginRight: '15px',
      marginLeft: 'initial',
    });

  /**
   * When a task should be saved.
   */
  const onSaveTask = () => {
    const { value } = input;
    if (value.trim().length === 0) return;

    // Add new item
    fabricate.update('tasks', (prev) => [...prev.tasks, value]);

    // Reset (TODO: Controlled input)
    // eslint-disable-next-line no-param-reassign
    input.value = '';
  };

  return fabricate('Card')
    .setStyles({ margin: 'auto', marginTop: '15px' })
    .setChildren([
      fabricate('Row')
        .setStyles({
          alignItems: 'center',
          maxWidth: '600px',
          minWidth: '500px',
          padding: '3px',
        })
        .setChildren([
          icon,
          input,
          fabricate('Button', { text: 'Create', backgroundColor: 'gold' })
            .setStyles({ minWidth: '50px' })
            .onClick(() => onSaveTask(input)),
        ]),
    ]);
};

/**
 * Component for each task item.
 *
 * @param {string} content - Content of the task.
 * @returns {HTMLElement} Fabricate component.
 */
const TaskCard = (content) => fabricate('Card')
  .setStyles({
    backgroundColor: 'gold',
    color: 'black',
    margin: '10px',
    padding: '5px',
  })
  .setChildren([
    fabricate('div')
      .setStyles({ padding: '5px', fontSize: '1.6rem' })
      .setText(content),

    fabricate('Button', {
      text: 'Delete',
      color: 'white',
      backgroundColor: 'darkred',
    })
      .setStyles({ minWidth: '50px', padding: '5px' })
      .onClick(() => {
        // Remove the item
        fabricate.update('tasks', ({ tasks }) => tasks.filter((p) => p !== content));
      }),
  ]);

/**
 * Component to view all existing tasks.
 *
 * @returns {HTMLElement} Fabricate component.
 */
const TaskList = () => fabricate('Row')
  .setStyles({ padding: '10px', flexWrap: 'wrap' })
  .onUpdate((el, state) => {
    el.setChildren(state.tasks.map(TaskCard));
  }, ['fabricate:init', 'tasks']);

/**
 * App component.
 *
 * @returns {HTMLElement} Fabricate component.
 */
const App = () => fabricate('Column')
  .setChildren([
    fabricate('NavBar', {
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
fabricate.app(App, initialState, options);
