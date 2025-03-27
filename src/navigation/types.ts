export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type MainStackParamList = {
  Home: undefined;
  ArticlesTab: undefined;
  Articles: undefined;
  ArticleDetail: { articleId: string };
  QuizzesTab: undefined;
  QuizScreen: { articleId: string };
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Main: undefined;
  Auth: undefined;
};