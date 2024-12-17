import { Devvit } from '@devvit/public-api';
import { App } from './app.js';

Devvit.configure({
  redditAPI: true,
  redis: true,
});

// Adds a new menu item to the subreddit allowing to create a new post
Devvit.addMenuItem({
  label: 'Create New Maze',
  location: 'subreddit',
  onPress: async (_event, context) => {
    const { reddit, ui } = context;
    const subreddit = await reddit.getCurrentSubreddit();
    const post = await reddit.submitPost({
      title: 'Escape the Maze',
      subredditName: subreddit.name,
      // The preview appears while the post loads
      preview: (
        <vstack height="100%" width="100%" alignment="middle center">
          <text size="large">Loading ...</text>
        </vstack>
      ),
    });
    ui.showToast({ text: 'Created new Maze!' });
    ui.navigateTo(post);
  },
});

Devvit.addCustomPostType({
  name: 'Maze Escape',
  description: 'Navigate the maze to find the exit!',
  height: 'tall',
  render: App,
});

export default Devvit;
