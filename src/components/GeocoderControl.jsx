// ===============================================================================
// Copyright 2024 Jake Ross
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// ===============================================================================


import {useState} from "react";
import {useControl} from "react-map-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";

// type GeocoderControlProps = Omit<
//   GeocoderOptions,
//   "accessToken" | "mapboxgl" | "marker"
// > & {
//   mapboxAccessToken: string;
//   marker?: boolean | Omit<MarkerProps, "longitude" | "latitude">;
//
//   position: ControlPosition;
//
//   onLoading?: (e: object) => void;
//   onResults?: (e: object) => void;
//   onResult?: (e: object) => void;
//   onError?: (e: object) => void;
// };

/* eslint-disable complexity,max-statements */
// export default function GeocoderControl(props: GeocoderControlProps) {
export default function GeocoderControl({token=null, position='top-left'}) {
  const props = {};
  const [marker, setMarker] = useState(null);

  const geocoder = useControl(
    () => {
      // ctrl.on("loading", props.onLoading);
      // ctrl.on('results', props.onResults);
      // ctrl.on('result', evt => {
      //     props.onResult(evt);
      //
      //     const {result} = evt;
      //     const location =
      //         result &&
      //         (result.center || (result.geometry?.type === 'Point' && result.geometry.coordinates));
      //     if (location && props.marker) {
      //         setMarker(<Marker {...props.marker} longitude={location[0]} latitude={location[1]} />);
      //     } else {
      //         setMarker(null);
      //     }
      // });
      // ctrl.on("error", props.onError);
      return new MapboxGeocoder({
        marker: false,
        accessToken: token,
      });
    },
    {
      position: position,
    },
  );

  // @ts-ignore (TS2339) private member
  if (geocoder._map) {
    if (
      geocoder.getProximity() !== props.proximity &&
      props.proximity !== undefined
    ) {
      geocoder.setProximity(props.proximity);
    }
    if (
      geocoder.getRenderFunction() !== props.render &&
      props.render !== undefined
    ) {
      geocoder.setRenderFunction(props.render);
    }
    if (
      geocoder.getLanguage() !== props.language &&
      props.language !== undefined
    ) {
      geocoder.setLanguage(props.language);
    }
    if (geocoder.getZoom() !== props.zoom && props.zoom !== undefined) {
      geocoder.setZoom(props.zoom);
    }
    if (geocoder.getFlyTo() !== props.flyTo && props.flyTo !== undefined) {
      geocoder.setFlyTo(props.flyTo);
    }
    if (
      geocoder.getPlaceholder() !== props.placeholder &&
      props.placeholder !== undefined
    ) {
      geocoder.setPlaceholder(props.placeholder);
    }
    if (
      geocoder.getCountries() !== props.countries &&
      props.countries !== undefined
    ) {
      geocoder.setCountries(props.countries);
    }
    if (geocoder.getTypes() !== props.types && props.types !== undefined) {
      geocoder.setTypes(props.types);
    }
    if (
      geocoder.getMinLength() !== props.minLength &&
      props.minLength !== undefined
    ) {
      geocoder.setMinLength(props.minLength);
    }
    if (geocoder.getLimit() !== props.limit && props.limit !== undefined) {
      geocoder.setLimit(props.limit);
    }
    if (geocoder.getFilter() !== props.filter && props.filter !== undefined) {
      geocoder.setFilter(props.filter);
    }
    if (geocoder.getOrigin() !== props.origin && props.origin !== undefined) {
      geocoder.setOrigin(props.origin);
    }
    // Types missing from @types/mapbox__mapbox-gl-geocoder
    // if (geocoder.getAutocomplete() !== props.autocomplete && props.autocomplete !== undefined) {
    //   geocoder.setAutocomplete(props.autocomplete);
    // }
    // if (geocoder.getFuzzyMatch() !== props.fuzzyMatch && props.fuzzyMatch !== undefined) {
    //   geocoder.setFuzzyMatch(props.fuzzyMatch);
    // }
    // if (geocoder.getRouting() !== props.routing && props.routing !== undefined) {
    //   geocoder.setRouting(props.routing);
    // }
    // if (geocoder.getWorldview() !== props.worldview && props.worldview !== undefined) {
    //   geocoder.setWorldview(props.worldview);
    // }
  }
  return marker;
}

const noop = () => {};

GeocoderControl.defaultProps = {
  marker: true,
  onLoading: noop,
  onResults: noop,
  onResult: noop,
  onError: noop,
};

// ============= EOF =============================================
