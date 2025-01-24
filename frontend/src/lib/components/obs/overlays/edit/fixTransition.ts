import { CustomElement } from "$lib/models/constants/customElement";
import { AnimationTrigger } from "$lib/models/types/animationOption";
import type { GridContentItem } from "$lib/models/types/overlay";
import { cloneDeep } from "lodash";

export function fixTransition(item: GridContentItem) {
    let newItem: GridContentItem = { ...item }
    newItem = forceApplyTransitions(newItem)
    return newItem
}

const forceApplyTransitions = (item: GridContentItem): GridContentItem => {
    let newItem = cloneDeep(item);

    newItem = fixInGameSlippiSessionTransition(newItem)
    newItem = fixMatchTransition(newItem)
    newItem = fixSlippiSessionTransition(newItem)
    newItem = fixSlippiStatsTransition(newItem)
    return newItem;
}

const fixMatchTransition = (item: GridContentItem) => {
    if (
        [
            CustomElement.MatchBestOf,
        ].includes(item.elementId)
    ) {
        item.data.animationTrigger.selectedOptions[AnimationTrigger.MatchBestOfChange] = true;
    }
    if (
        [
            CustomElement.MatchGameMode,
        ].includes(item.elementId)
    ) {
        item.data.animationTrigger.selectedOptions[AnimationTrigger.MatchGameModeChange] = true;
    }
    if (
        [
            CustomElement.MatchPlayer1Score,
        ].includes(item.elementId)
    ) {
        item.data.animationTrigger.selectedOptions[AnimationTrigger.MatchPlayer1ScoreChange] = true;
    }
    if (
        [
            CustomElement.MatchPlayer2Score,
        ].includes(item.elementId)
    ) {
        item.data.animationTrigger.selectedOptions[AnimationTrigger.MatchPlayer2ScoreChange] = true;
    }

    return item
}

const fixInGameSlippiSessionTransition = (item: GridContentItem) => {
    if (
        [
            CustomElement.InGameCurrentPlayerCharacterIcon,
            CustomElement.InGameCurrentPlayerCharacterRenderLeft,
            CustomElement.InGameCurrentPlayerCharacterRenderRight,
        ].includes(item.elementId)
    ) {
        item.data.animationTrigger.selectedOptions[AnimationTrigger.InGameCurrentPlayerCharacterChange] = true;
    }
    if (
        [
            CustomElement.InGamePlayer1CharacterIcon,
            CustomElement.InGamePlayer1CharacterRenderLeft,
            CustomElement.InGamePlayer1CharacterRenderRight,
        ].includes(item.elementId)
    ) {
        item.data.animationTrigger.selectedOptions[AnimationTrigger.InGamePlayer1CharacterChange] = true;
    }
    if (
        [
            CustomElement.InGamePlayer2CharacterIcon,
            CustomElement.InGamePlayer2CharacterRenderLeft,
            CustomElement.InGamePlayer2CharacterRenderRight,
        ].includes(item.elementId)
    ) {
        item.data.animationTrigger.selectedOptions[AnimationTrigger.InGamePlayer2CharacterChange] = true;
    }

    return item
}

const fixSlippiSessionTransition = (item: GridContentItem) => {
    if (
        [
            CustomElement.SessionGameNumber,
        ].includes(item.elementId)
    ) {
        item.data.animationTrigger.selectedOptions[AnimationTrigger.SessionGames] = true;
    }
    if (
        [
            CustomElement.SessionWins,
        ].includes(item.elementId)
    ) {
        item.data.animationTrigger.selectedOptions[AnimationTrigger.SessionWins] = true;
    }
    if (
        [
            CustomElement.SessionLosses,
        ].includes(item.elementId)
    ) {
        item.data.animationTrigger.selectedOptions[AnimationTrigger.SessionLosses] = true;
    }
    if (
        [
            CustomElement.SessionRating,
        ].includes(item.elementId)
    ) {
        item.data.animationTrigger.selectedOptions[AnimationTrigger.SessionRating] = true;
    }

    return item
}

const fixSlippiStatsTransition = (item: GridContentItem) => {
    if (
        [
            CustomElement.MatchPlayer1Tag,
        ].includes(item.elementId)
    ) {
        item.data.animationTrigger.selectedOptions[AnimationTrigger.MatchPlayer1TagChange] = true;
    }
    if (
        [
            CustomElement.MatchPlayer2Tag,
        ].includes(item.elementId)
    ) {
        item.data.animationTrigger.selectedOptions[AnimationTrigger.MatchPlayer2TagChange] = true;
    }
    if (
        [
            CustomElement.SlippiRankPlayer1ConnectCode,
        ].includes(item.elementId)
    ) {
        item.data.animationTrigger.selectedOptions[AnimationTrigger.SlippiRankPlayer1ConnectCodeChange] = true;
    }
    if (
        [
            CustomElement.SlippiRankPlayer2ConnectCode,
        ].includes(item.elementId)
    ) {
        item.data.animationTrigger.selectedOptions[AnimationTrigger.SlippiRankPlayer2ConnectCodeChange] = true;
    }
    if (
        [
            CustomElement.SlippiRankCurrentPlayerRankIcon,
        ].includes(item.elementId)
    ) {
        item.data.animationTrigger.selectedOptions[AnimationTrigger.SlippiRankStatsRankChange] = true;
    }
    if (
        [
            CustomElement.SlippiRankCurrentPlayerRankText,
        ].includes(item.elementId)
    ) {
        item.data.animationTrigger.selectedOptions[AnimationTrigger.SlippiRankStatsRankChange] = true;
    }
    if (
        [
            CustomElement.SlippiRankCurrentPlayerRating,
        ].includes(item.elementId)
    ) {
        item.data.animationTrigger.selectedOptions[AnimationTrigger.SlippiRankStatsRatingChange] = true;
    }
    if (
        [
            CustomElement.SlippiRankCurrentPlayerWins,
            CustomElement.SlippiRankCurrentPlayerWinsPercent,
        ].includes(item.elementId)
    ) {
        item.data.animationTrigger.selectedOptions[AnimationTrigger.SlippiRankStatsWinsChange] = true;
    }
    if (
        [
            CustomElement.SlippiRankCurrentPlayerLosses,
            CustomElement.SlippiRankCurrentPlayerLossesPercent,
        ].includes(item.elementId)
    ) {
        item.data.animationTrigger.selectedOptions[AnimationTrigger.SlippiRankStatsLossesChange] = true;
    }


    return item
}