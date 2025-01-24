;
import { MaterialCommunityIcons } from '@expo/vector-icons';

const IconMap: { [key: string]: keyof typeof MaterialCommunityIcons.glyphMap} = {
    food: "food-outline",
    transport: "car-outline",
    travel: "bag-suitcase-outline",
    groceries: "cart-variant",
    house: "home-variant-outline",
    cure: "heart-plus-outline",
    pet: "cat",
    education: "book-open-blank-variant",
    clothes: "hanger",
    cosmetics: "lipstick",
    accessories: "necklace",
    insurance: "shield-plus-outline",
    hobby: "music",
    utilities: "water-pump",
    vehicle: "car-wrench",
    fee: "folder",
    business: "office-building",
    game: "google-controller",
    // debtPayment: "hand-coin-outline",
    other: "dots-horizontal",

    borrowed: "hand-coin-outline",
    dividend: "clover",
    refund: "cash-refund",
    salary: "calendar-month",
    gift: "gift",

    transfer: "swap-horizontal",
  };
  
  export default IconMap;