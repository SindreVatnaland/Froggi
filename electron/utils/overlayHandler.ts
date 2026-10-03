import { AnimationSettings, AspectRatio, ElementPayload, Overlay, Scene } from "../../frontend/src/lib/models/types/overlay";
import { getDefaultElementPayload } from '../../frontend/src/lib/utils/overlayElementDefaults';
import { merge } from 'lodash';
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
    [LiveStatsScene.StrikePhase]: getDefaultScene(false),
  } as Overlay;
}

/**
 * Fills anything missing from an overlay built by another Froggi version (imported file): missing
 * scenes, missing scene settings, missing element payload fields. Without this a single absent field
 * (e.g. item.data.font) throws while rendering and the overlay shows up empty. Mutates + returns.
 */
export function fillOverlayDefaults(overlay: Overlay): Overlay {
  const template = getNewOverlay(overlay.aspectRatio);
  for (const scene of Object.values(LiveStatsScene)) {
    const { layers: defaultLayers, ...sceneDefaults } = template[scene];
    const imported = overlay[scene] as Partial<Scene> | undefined;
    const layers = imported?.layers?.length ? imported.layers : defaultLayers;
    for (const layer of layers) {
      layer.items = (layer.items ?? []).map((item) => ({
        ...item,
        data: merge(getDefaultElementPayload(), item.data as Partial<ElementPayload> | undefined),
      }));
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (overlay as any)[scene] = { ...merge(sceneDefaults, { ...imported, layers: undefined }), layers };
  }
  overlay.aspectRatio ??= template.aspectRatio;
  return overlay;
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