// Server-side source of truth for shop prices/items. The browser only
// ever sends an item id — price, title, and Buddy-capability group
// always come from here, never from the request body.

export const SHOP_INVENTORY = [
  {
    id: 'better-eyes',
    title: 'Give Buddy Better Eyes',
    item: "Webcam reward — Up to $30 product + $10 shipping",
    price: 8,
    group: 'better-eyes'
  },
  {
    id: 'better-lighting',
    title: 'Better Lighting',
    item: "Lighting reward — Up to $20 product + $10 shipping",
    price: 6,
    group: null
  },
  {
    id: 'better-vision',
    title: 'Give Buddy Better Vision',
    item: "Roboflow credit grant — Up to $10 in digital credits",
    price: 2,
    group: 'better-vision'
  },
  {
    id: 'brain-10',
    title: 'Give Buddy a Brain',
    item: "AI API credit grant — Up to $10 in digital credits",
    price: 2,
    group: 'brain'
  },
  {
    id: 'brain-25',
    title: 'Give Buddy a Bigger Brain',
    item: "AI API credit grant — Up to $25 in digital credits",
    price: 5,
    group: 'brain'
  },
  {
    id: 'memory',
    title: 'Give Buddy a Memory',
    item: "Database / storage credit grant — Up to $15 in digital credits",
    price: 3,
    group: 'memory'
  },
  {
    id: 'training-power',
    title: 'Train Buddy Properly',
    item: "Roboflow grant — Up to $100 toward Roboflow Core or credits",
    price: 20,
    group: 'training-power'
  },
  {
    id: 'ears',
    title: 'Give Buddy Ears',
    item: "Microphone reward — Up to $25 product + $10 shipping",
    price: 7,
    group: 'ears'
  },
  {
    id: 'custom-voice',
    title: 'Give Buddy a Voice',
    item: "ElevenLabs grant — Up to $15 toward ElevenLabs credits or a subscription",
    price: 3,
    group: 'custom-voice'
  },
  {
    id: 'body',
    title: 'Give Buddy a Body',
    item: "Hardware grant — Up to $25 to buy your own parts",
    price: 5,
    group: 'body'
  },
  {
    id: 'face',
    title: 'Give Buddy a Face',
    item: "Display reward — Up to $30 product + $10 shipping",
    price: 8,
    group: 'face'
  },
  {
    id: 'more-senses',
    title: 'Give Buddy More Senses',
    item: "Sensor hardware grant — Up to $50 to buy your own parts",
    price: 10,
    group: 'more-senses'
  }
];

export function getShopItem(id) {
  return SHOP_INVENTORY.find((entry) => entry.id === id) ?? null;
}
