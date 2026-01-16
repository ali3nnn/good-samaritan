const adjectives = [
    'Adventurous', 'Brave', 'Clever', 'Daring', 'Energetic',
    'Friendly', 'Gentle', 'Happy', 'Intelligent', 'Joyful',
    'Kind', 'Lively', 'Majestic', 'Noble', 'Optimistic',
    'Playful', 'Quiet', 'Radiant', 'Swift', 'Thoughtful',
    'Unique', 'Vibrant', 'Wise', 'Zealous', 'Ambitious',
    'Brilliant', 'Curious', 'Delightful', 'Eager', 'Fearless',
    'Graceful', 'Humble', 'Imaginative', 'Jolly', 'Keen',
    'Loyal', 'Merry', 'Nimble', 'Observant', 'Patient',
    'Quick', 'Resourceful', 'Serene', 'Talented', 'Upbeat',
    'Valiant', 'Witty', 'Exuberant', 'Youthful', 'Zesty'
]

const animals = [
    'Bird', 'Fox', 'Deer', 'Wolf', 'Bear',
    'Eagle', 'Hawk', 'Owl', 'Rabbit', 'Squirrel',
    'Otter', 'Beaver', 'Badger', 'Hedgehog', 'Sparrow',
    'Robin', 'Swan', 'Duck', 'Goose', 'Heron',
    'Falcon', 'Raven', 'Crow', 'Dove', 'Finch',
    'Lion', 'Tiger', 'Leopard', 'Lynx', 'Puma',
    'Moose', 'Elk', 'Reindeer', 'Buffalo', 'Bison',
    'Panda', 'Koala', 'Kangaroo', 'Wallaby', 'Wombat',
    'Penguin', 'Seal', 'Walrus', 'Dolphin', 'Whale',
    'Turtle', 'Tortoise', 'Frog', 'Salamander', 'Newt'
]

export function generateRandomName(): string {
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)]
    const randomAnimal = animals[Math.floor(Math.random() * animals.length)]
    return `${randomAdjective} ${randomAnimal}`
}
