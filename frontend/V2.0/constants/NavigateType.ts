export type RootStackParamList = {
    Home: undefined; // No parameters for Home screen
    CreateTransaction: { category?: string }; // category is required for CreateTransaction
    Category:undefined;
    modal: undefined; // No parameters for modal screen
  };