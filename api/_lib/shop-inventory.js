// Server-side source of truth for shop prices/items. The browser only
// ever sends an item id — price, title, and Buddy-capability group
// always come from here, never from the request body.

export const SHOP_INVENTORY = [
  {
    id: 'better-eyes',
    title: 'Give Buddy Better Eyes',
    item: 'Logitech C270 Webcam',
    price: 8,
    group: 'better-eyes'
  },
  {
    id: 'better-lighting',
    title: 'Better Lighting',
    item: 'USB Desk Light',
    price: 6,
    group: null
  },
  {
    id: 'better-vision',
    title: 'Give Buddy Better Vision',
    item: 'Roboflow Credits',
    price: 2,
    group: 'better-vision'
  },
  {
    id: 'brain-10',
    title: 'Give Buddy a Brain',
    item: '$10 AI Credit Grant',
    price: 2,
    group: 'brain'
  },
  {
    id: 'brain-25',
    title: 'Give Buddy a Bigger Brain',
    item: '$25 AI Credit Grant',
    price: 5,
    group: 'brain'
  },
  {
    id: 'memory',
    title: 'Give Buddy a Memory',
    item: 'Database / Storage Credit Grant',
    price: 3,
    group: 'memory'
  },
  {
    id: 'training-power',
    title: 'Train Buddy Properly',
    item: 'Roboflow Core',
    price: 20,
    group: 'training-power'
  },
  {
    id: 'ears',
    title: 'Give Buddy Ears',
    item: 'USB Microphone',
    price: 7,
    group: 'ears'
  },
  {
    id: 'custom-voice',
    title: 'Give Buddy a Voice',
    item: 'ElevenLabs Voice Creator',
    price: 3,
    group: 'custom-voice'
  },
  {
    id: 'body',
    title: 'Give Buddy a Body',
    item: '$25 Hardware Grant',
    price: 5,
    group: 'body'
  },
  {
    id: 'face',
    title: 'Give Buddy a Face',
    item: 'Small Display Grant',
    price: 8,
    group: 'face'
  },
  {
    id: 'more-senses',
    title: 'Give Buddy More Senses',
    item: 'Sensor Hardware Grant',
    price: 5,
    group: 'more-senses'
  }
];

export function getShopItem(id) {
  return SHOP_INVENTORY.find((entry) => entry.id === id) ?? null;
}
