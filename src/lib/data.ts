import { PlaceHolderImages } from "./placeholder-images";

const imageMap = PlaceHolderImages.reduce((acc, img) => {
  acc[img.id] = img;
  return acc;
}, {} as Record<string, (typeof PlaceHolderImages)[0]>);


export const mockUser = {
  name: "Akua",
  email: "akua.g@example.com",
  onboardingCompleted: true,
  profilePictureUrl: imageMap['user-avatar-1']?.imageUrl || "https://picsum.photos/seed/akua/100/100",
  goal: 'lose-weight'
};

export const healthQuotes = [
  "The greatest wealth is health.",
  "To keep the body in good health is a duty.",
  "Let food be thy medicine and medicine be thy food.",
  "A healthy outside starts from the inside.",
  "Take care of your body. It's the only place you have to live.",
];
