import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
  ProductDetail: { productId: string };
  OrderDetail: { orderId: string };
  ChatThread: { userId: string; userName: string };
  Cart: undefined;
  SellerDashboard: undefined;
  Settings: undefined;
};

export type MainTabParamList = {
  Marketplace: undefined;
  Social: undefined;
  Messages: undefined;
  Wallet: undefined;
  Profile: undefined;
};

export type MarketplaceStackParamList = {
  MarketplaceHome: undefined;
  ProductDetail: { productId: string };
  Cart: undefined;
  Search: undefined;
};

export type SocialStackParamList = {
  SocialFeed: undefined;
  UserProfile: { userId: string };
};

export type MessagesStackParamList = {
  MessagesList: undefined;
  ChatThread: { userId: string; userName: string };
};

export type WalletStackParamList = {
  WalletHome: undefined;
  OrderDetail: { orderId: string };
  Orders: undefined;
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  SellerDashboard: undefined;
  Settings: undefined;
  EditProfile: undefined;
};
