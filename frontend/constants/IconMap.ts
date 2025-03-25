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

    "40(1)Salary": "hand-coin-outline",
    "40(2)Freelance": "clover",
    "40(3)Royalties": "cash-refund",
    "40(4)Interest": "gift",
    "40(5)Rent": "home-city-outline",
    "40(6)Profession": "briefcase",
    "40(7)Contract": "file-document-outline",
    "40(8)Business": "office-building",
    "Other": "dots-horizontal",
    
    transfer: "swap-horizontal",
  };
  
  export default IconMap;