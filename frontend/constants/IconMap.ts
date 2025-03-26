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

    "40(1)salary": "hand-coin-outline",
    "40(2)freelance": "clover",
    "40(3)royalties": "cash-refund",
    "40(4)interest": "gift",
    "40(5)rent": "home-city-outline",
    "40(6)profession": "briefcase",
    "40(7)contract": "file-document-outline",
    "40(8)business": "office-building",
    
    transfer: "swap-horizontal",
  };
  
  export default IconMap;