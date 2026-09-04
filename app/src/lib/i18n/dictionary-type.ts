// Vollstaendige Form eines Sprachpakets. de.ts/en.ts/pt-BR.ts werden gegen
// dieses Interface typgeprueft, damit keine Uebersetzung unvollstaendig
// bleiben kann (fehlender Key = TypeScript-Fehler beim Build).
export interface Dictionary {
  common: {
    loading: string;
    cancel: string;
    save: string;
    saved: string;
    back: string;
    yes: string;
    no: string;
  };

  nav: {
    island: string;
    neighbors: string;
    market: string;
    economy: string;
    settings: string;
    loggedInAs: (username: string) => string;
    signOut: string;
    yearBadge: string;
  };

  landing: {
    title: string;
    /** Browser-Tab/Suchmaschinen-Beschreibung (siehe app/layout.tsx generateMetadata). */
    metaDescription: string;
    heroKicker: string;
    heroTitle: string;
    heroSubtitle: string;
    ctaRegister: string;
    ctaLogin: string;
    featuresTitle: string;
    features: { icon: string; title: string; text: string }[];
    screenshotCaption: string;
    footerNote: string;
  };

  auth: {
    login: {
      title: string;
      subtitle: string;
      email: string;
      password: string;
      submit: string;
      submitting: string;
      wrongCredentials: string;
      accountCreated: string;
      noAccount: string;
      registerLink: string;
    };
    register: {
      title: string;
      subtitle: string;
      username: string;
      email: string;
      password: string;
      language: string;
      submit: string;
      submitting: string;
      haveAccount: string;
      loginLink: string;
      genericError: string;
    };
  };

  onboarding: {
    skip: string;
    next: string;
    back: string;
    start: string;
    stepCounter: (step: number, total: number) => string;
    story: { title: string; text: string }[];
    tutorialIntro: { title: string; text: string };
    tutorial: { title: string; text: string }[];
    finish: string;
  };

  settings: {
    title: string;
    languageLabel: string;
    languageHint: string;
    saveButton: string;
    savedMessage: string;
    replayTutorial: string;
    replayTutorialHint: string;
    accountTitle: string;
    emailLabel: string;
    emailNote: string;
    usernameLabel: string;
    usernameSaveButton: string;
    usernameSavedMessage: string;
    usernameCooldownNote: (date: string) => string;
    passwordTitle: string;
    currentPasswordLabel: string;
    newPasswordLabel: string;
    confirmPasswordLabel: string;
    changePasswordButton: string;
    passwordSavedMessage: string;
    passwordMismatchError: string;
    dangerZoneTitle: string;
    deleteAccountButton: string;
    deleteAccountWarning: string;
    deleteAccountConfirmButton: string;
  };

  dashboard: {
    intro: string;
    basics: { title: string; level: string; xpSuffix: string; levelUpToast: (level: number) => string };
    stats: { hunger: string; thirst: string; energy: string };
    activeAction: {
      running: (label: string) => string;
      completing: string;
      cancelButton: string;
      cancelNoteDefault: string;
      cancelNoteVegetables: string;
      cancelNoteMeal: string;
    };
    inventory: {
      title: string;
      coins: string;
      resourcesTitle: string;
      villageTitle: string;
      figs: string;
      wood: string;
      water: string;
      vegetable: string;
      fish: string;
      stone: string;
      fireplace: string;
      shelter: string;
      well: string;
      garden: string;
      storehouse: string;
      built: string;
      open: string;
    };
    actions: {
      collectTitle: string;
      collectHint: string;
      collectFig: string;
      collectWood: string;
      collectWater: string;
      collectFish: string;
      collectStone: string;
      noRegionsHint: string;
      consumeTitle: string;
      eatFig: string;
      eatFish: string;
      drinkWater: string;
      growSleepTitle: string;
      growSleepHint: string;
      plantVegetables: (cost: number) => string;
      cookMeal: string;
      sleep: string;
      buildTitle: string;
      buildHint: string;
      fireplaceBuilt: string;
      upgradeShelter: (nextLevel: number) => string;
      shelterMaxLevel: string;
      wellBuilt: string;
      gardenBuilt: string;
      storehouseBuilt: string;
      buildPath: string;
      layingPath: string;
      perTile: string;
      choosingSpot: string;
    };
    placement: {
      chooseFireplace: string;
      chooseWell: string;
      chooseGarden: string;
      chooseStorehouse: string;
      choosePath: string;
      cancelButton: string;
      doneButton: string;
    };
    island: {
      title: string;
      day: string;
      night: string;
      sunny: string;
      rainy: string;
      cloudy: string;
      clear: string;
      builtCount: (count: number, total: number) => string;
      regionLabel: {
        grove: string;
        forest: string;
        spring: string;
        field: string;
        sea: string;
        quarry: string;
      };
      fireplace: string;
      shelter: string;
      well: string;
      garden: string;
      storehouse: string;
      builtLabel: string;
      openLabel: string;
      walkHint: string;
      placeHint: string;
      lockedHint: string;
    };
  };

  players: {
    introBefore: string;
    introAfter: string;
    empty: string;
    levelAbbrev: string;
    fireplaceBadge: string;
    shelterBadge: string;
    wellBadge: string;
    gardenBadge: string;
    storehouseBadge: string;
    visitButton: string;
    marketLink: string;
    backLink: string;
  };

  visit: {
    title: (username: string) => string;
    viewOnlyBadge: string;
    youLabel: string;
    inventoryTitle: string;
    readOnlyNoteBefore: string;
    readOnlyNoteAfter: (username: string) => string;
    marketLink: string;
  };

  market: {
    intro: string;
    merchantTitle: string;
    merchantIntro: string;
    merchantSellButton: (price: number) => string;
    merchantBuyButton: (price: number) => string;
    merchantSoldToast: string;
    merchantBoughtToast: string;
    economyInflation: string;
    economyDeflation: string;
    economyStable: string;
    createOfferTitle: string;
    createOfferIntro: string;
    youGive: string;
    youGet: string;
    haveCurrently: (amount: number) => string;
    submitOffer: string;
    myOffersTitle: string;
    withdraw: string;
    openOffersTitle: string;
    openOffersIntro: string;
    noOpenOffers: string;
    forConnector: string;
    tradeButton: string;
    notEnoughStock: string;
    mustDifferError: string;
    offerCreatedToast: string;
    tradeCompletedToast: string;
    offerWithdrawnToast: string;
  };

  economy: {
    intro: string;
    sellSeriesLabel: string;
    buySeriesLabel: string;
    noDataYet: string;
    viewChart: string;
    viewTable: string;
    tableTimeHeader: string;
    tableSellHeader: string;
    tableBuyHeader: string;
    basePriceTitle: string;
    basePriceResourceHeader: string;
    basePriceSellHeader: string;
    basePriceBuyHeader: string;
  };

  resources: {
    fig: string;
    wood: string;
    water: string;
    vegetable: string;
    fish: string;
    stone: string;
    coin: string;
  };

  actionLabels: {
    collect_figs: string;
    collect_wood: string;
    collect_water: string;
    collect_fish: string;
    collect_stone: string;
    plant_vegetables: string;
    sleep: string;
    cook_meal: string;
  };

  errors: {
    NOT_LOGGED_IN: string;
    NO_PLAYER: string;
    BUSY: string;
    NO_FIGS: string;
    NO_FISH: string;
    NO_WATER: string;
    NOT_ENOUGH_SEED_FIGS: string;
    FIREPLACE_ALREADY_BUILT: string;
    WELL_ALREADY_BUILT: string;
    GARDEN_ALREADY_BUILT: string;
    STOREHOUSE_ALREADY_BUILT: string;
    NO_FIREPLACE: string;
    NOT_ENOUGH_FISH: string;
    NOT_ENOUGH_VEGETABLES: string;
    PATH_LIMIT_REACHED: string;
    SHELTER_MAX_LEVEL: string;
    NOT_ENOUGH_WOOD: string;
    NOT_ENOUGH_STONE: string;
    NOT_ENOUGH_COINS: string;
    ACTION_ALREADY_COMPLETED: string;
    NO_ACTIVE_ACTION: string;
    TOO_FAR_AWAY: (station: string) => string;
    NO_REGION_ON_ISLAND: (region: string) => string;
    INVALID_POSITION: string;
    NO_BUILD_SPOT: string;
    INVALID_RESOURCE: string;
    SAME_RESOURCE: string;
    INVALID_AMOUNTS: string;
    NOT_ENOUGH_FOR_OFFER: string;
    OFFER_NOT_AVAILABLE: string;
    OWN_OFFER: string;
    NOT_ENOUGH_FOR_TRADE: string;
    NOT_YOUR_OFFER: string;
    OFFER_NOT_OPEN: string;
    PLAYER_NOT_FOUND: string;
    USERNAME_TAKEN: string;
    INVALID_REGISTRATION: string;
    INVALID_EMAIL: string;
    EMAIL_TAKEN: string;
    USERNAME_TOO_SHORT: string;
    USERNAME_COOLDOWN: (date: string) => string;
    WRONG_CURRENT_PASSWORD: string;
    PASSWORD_TOO_SHORT: string;
    GENERIC: string;
  };
}
