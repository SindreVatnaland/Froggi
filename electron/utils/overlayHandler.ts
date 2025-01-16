import { AnimationSettings, AspectRatio, Overlay, Scene } from "../../frontend/src/lib/models/types/overlay";
import { Animation, LiveStatsScene, SceneBackground } from '../../frontend/src/lib/models/enum';
import { SCENE_TRANSITION_DELAY } from "../../frontend/src/lib/models/const";
import { newId } from "./functions";

const getDefaultScene = (active: boolean = true): Scene => {
  return {
    id: undefined,
    active: active,
    animation: {
      duration: 250,
      in: getDefaultAnimations(SCENE_TRANSITION_DELAY),
      out: getDefaultAnimations(),
      layerRenderDelay: 250,
    },
    background: {
      color: '#000000',
      customImage: {
        src: undefined,
        name: undefined,
        objectFit: undefined,
      },
      image: { src: undefined, name: undefined, objectFit: undefined },
      opacity: 100,
      type: SceneBackground.None,
      animation: {
        in: getDefaultAnimations(SCENE_TRANSITION_DELAY),
        out: getDefaultAnimations(),
      },
    },
    fallback: LiveStatsScene.Menu,
    font: {
      family: 'default',
      src: '',
    },
    layers: [
      {
        id: undefined,
        items: [],
        preview: true,
        index: 0,
      },
    ],
  };
};

export function getNewOverlay(aspect: AspectRatio = { width: 16, height: 9 }): Overlay {
  const id = newId()
  return {
    id: id,
    defaultScene: LiveStatsScene.Menu,
    description: 'Scene Description',
    isDemo: false,
    title: `New Overlay - ${id}`,
    aspectRatio: aspect,
    froggiVersion: '',
    [LiveStatsScene.WaitingForDolphin]: getDefaultScene(),
    [LiveStatsScene.Menu]: getDefaultScene(),
    [LiveStatsScene.InGame]: getDefaultScene(),
    [LiveStatsScene.PostGame]: getDefaultScene(),
    [LiveStatsScene.PostSet]: getDefaultScene(false),
    [LiveStatsScene.RankChange]: getDefaultScene(),
  } as Overlay;
}

function getDefaultAnimations(delay: number = 0): AnimationSettings {
  return {
    options: {
      delay: delay,
      duration: 0,
      easing: '',
      start: 0,
      x: 0,
      y: 0,
    },
    type: Animation.None,
  };
}