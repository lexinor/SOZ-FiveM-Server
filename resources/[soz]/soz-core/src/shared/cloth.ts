export enum Component {
    Head = 0,
    Mask = 1,
    Hair = 2,
    Arms = 3,
    Pants = 4,
    Bag = 5,
    Shoes = 6,
    Chain = 7,
    Top = 8,
    Bulletproof = 9,
    Decals = 10,
    Torso = 11,
}

export enum Prop {
    Head = 0,
    Glasses = 1,
    Ear = 2,
    LeftHand = 6,
    RightHand = 7,
    Helmet = 'Helmet',
}

export type OutfitItem = {
    Drawable: number;
    Texture: number;
    Palette: number;
};

export type Outfit = {
    Components: Partial<Record<Component, OutfitItem>>;
    Props: Partial<Record<Prop, OutfitItem>>;
};

export type ClothConfig = {
    BaseClothSet: Outfit;
    NakedClothSet: Outfit;
    JobClothSet: Outfit | null;
    TemporaryClothSet: Outfit | null;
    Config: {
        Naked: boolean;
        ShowHelmet: boolean;
        HideHead: boolean;
        HideMask: boolean;
        HideGlasses: boolean;
        HideEar: boolean;
        HideChain: boolean;
        HideBulletproof: boolean;
        HideTop: boolean;
        HideLeftHand: boolean;
        HideRightHand: boolean;
        HideBag: boolean;
        HidePants: boolean;
        HideShoes: boolean;
    };
};

// A list of outfit indexed by name
export type Wardrobe = Record<string, Outfit>;

export type WardrobeMenuData = {
    wardrobe: Wardrobe;
    allowNullLabel?: string;
};

// A list of wardrobe indexed by model hash
export type WardrobeConfig = Record<number, Wardrobe>;