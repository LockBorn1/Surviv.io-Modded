import { HealEffectDefs } from "./healEffectDefs";
import { CrosshairDefs } from "./crosshairDefs";
import { PassDefs } from "./passDefs";
import { OutfitDefs } from "./outfitDefs";
import { MeleeDefs } from "./meleeDefs";

const _allowedHealEffects = Object.keys(HealEffectDefs);
const _allowedMeleeSkins = [
    "fists",
    "knuckles_rusted",
    "knuckles_heroic",
    "karambit_rugged",
    "karambit_prismatic",
    "karambit_drowned",
    "bayonet_rugged",
    "bayonet_woodland",
    "huntsman_rugged",
    "huntsman_burnished",
    "bowie_vintage",
    "bowie_frontier",
];
//const _allowedOutfits = [
    "outfitBase",
    "outfitTurkey",
    "outfitDev",
    "outfitMod",
    "outfitWheat",
    "outfitNoir",
    "outfitRedLeaderAged",
    "outfitBlueLeaderAged",
    "outfitSpetsnaz",
    "outfitWoodsCloak",
    "outfitElf",
    "outfitImperial",
    "outfitLumber",
    "outfitVerde",
    "outfitPineapple",
    "outfitTarkhany",
    "outfitWaterElem",
    "outfitHeaven",
    "outfitMeteor",
    "outfitIslander",
    "outfitAqua",
    "outfitCoral",
    "outfitKhaki",
    "outfitParma",
    "outfitParmaPrestige",
    "outfitCasanova",
    "outfitPrisoner",
    "outfitJester",
    "outfitWoodland",
    "outfitRoyalFortune",
    "outfitKeyLime",
    "outfitCobaltShell",
    "outfitCarbonFiber",
    "outfitDarkGloves",
    "outfitDarkShirt",
    "outfitDesertCamo",
    "outfitCamo",
    "outfitRed",
    "outfitWhite",
];

// Define interface for PassDefs items
interface PassItem {
    item: string;
    // Add other properties if needed based on PassDefs structure
}

export interface UnlockDef {
    readonly type: "unlock";
    name: string;
    unlocks: string[];
    free?: boolean;
}

export const UnlockDefs: Record<string, UnlockDef> = {
    unlock_default: {
        type: "unlock",
        name: "standard-issue",
        unlocks: [
            "outfitBase",
            "fists",
            "heal_basic",
            "boost_basic",
            "crosshair_default",
            "crosshair_001",
            "crosshair_005",
            "crosshair_007",
            "crosshair_086",
            "crosshair_027",
            "crosshair_080",
            "crosshair_098",
            "crosshair_101",
            "crosshair_158",
            "crosshair_094",
            "crosshair_118",
            "crosshair_136",
            "crosshair_160",
            "crosshair_176",
            // Unlock everything except emotes
            ...Object.keys(OutfitDefs),
            ...Object.keys(MeleeDefs),
            ..._allowedHealEffects,
            ...Object.keys(CrosshairDefs),
            ...PassDefs.pass_survivr1.items.map((item: PassItem) => item.item),
        ],
    },
    unlock_new_account: {
        type: "unlock",
        name: "new-account",
        free: true,
        unlocks: ["outfitDarkShirt"],
    },
};
