// ===============================================================================
// Copyright 2025 New Mexico Bureau of Geology & Mineral Resources (NMBGMR)
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

import * as Yup from 'yup';
import type { Dayjs } from 'dayjs';
import { IWellInventoryForm } from "@/interfaces/amp";

const wellInventoryFormSchema = Yup.object().shape({
  // General Section
  PointID: Yup.string().required('Point ID is required').default(''),
  SiteName: Yup.string().required('Site ID is required').default(''),
  DateTime: Yup.mixed<Dayjs>().required('Date & Time is required').default(null),
  FieldStaff: Yup.string().required('Field Staff is required').default(''),

  // Owner Data Section
  Owner: Yup.object().shape({
    Name: Yup.string().required('Owner name is required').default(''),
    Phone: Yup.object().shape({
      Home: Yup.string().optional().default(''),
      Cell: Yup.string().optional().default(''),
      Work: Yup.string().optional().default(''),
      Other: Yup.string().optional().default(''),
    }),
  }).required(),

  Address: Yup.object().shape({
    Physical: Yup.string().required('Physical address is required').default(''),
    Mailing: Yup.string().optional().default(''),
  }).required(),
  IsWellLocatedAtPhysicalAddress: Yup.boolean().required().default(false),
  Email: Yup.string().email('Invalid email').required('Email is required').default(''),
  DirectionsToSite: Yup.string().required('Directions to site are required').default(''),
  LocationOfWell: Yup.string().required('Location of well is required').default(''),

  OwnerGivePermissionFor: Yup.object().shape({
    RepeatMeasurements: Yup.boolean().required().default(false),
    SamplingInTheFuture: Yup.boolean().required().default(false),
    DataloggerInstallation: Yup.boolean().required().default(false),
  }).required(),
  DoesOwnerAcknowledgesDataWillBePubliclyAvailable: Yup.boolean().required().default(false),

  SpecialRequests: Yup.array().of(Yup.string()).optional().default([]),

  // Well Data Section
  Latitude: Yup.number()
    .required('Latitude is required')
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90')
    .default(0),
  Longitude: Yup.number()
    .required('Longitude is required')
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180')
    .default(0),
  Northing: Yup.number().required('Northing is required').default(0),
  Easting: Yup.number().required('Easting is required').default(0),
  Elevation: Yup.number().required('Elevation is required').default(0),
  ElevationUnits: Yup.string().required('Elevation Units is required').default(''),
  ElevationDatum: Yup.string().required('Elevation Datum is required').default(''),
  ElevationSource: Yup.string().required('Elevation Source is required').default(''),

  OSEWellRecord: Yup.string().required('OSE Well Record is required').default(''),
  DateDrilled: Yup.mixed<Dayjs>().required('Date Drilled is required').default(null),
  Source: Yup.array().of(Yup.string()).required().default([]),

  WellTotalDepth: Yup.number().required('Well Total Depth is required').default(0),
  WellTotalDepthUnits: Yup.string().required('Well Total Depth Units is required').default(''),

  HistoricDepthOfWater: Yup.number().required('Historic Depth Of Water is required').default(0),
  HistoricDepthOfWaterUnits: Yup.string().required('Historic Depth Of Water Units is required').default(''),

  WellType: Yup.string().required('Well Type is required').default(''),
  isDataloggerPossible: Yup.boolean().required().default(false),

  PumpDepth: Yup.number().required('Pump Depth is required').default(0),
  PumpDepthUnits: Yup.string().required('Pump Depth Units is required').default(''),

  OuterCasingDiameter: Yup.number().required('Outer Casing Diameter is required').default(0),
  OuterCasingDiameterUnits: Yup.string().required('Outer Casing Diameter Units is required').default(''),

  MPHeight: Yup.number().required('MP Height is required').default(0),
  MPHeightAboveOrBelowGround: Yup.boolean().required().default(false),
  MPHeightUnits: Yup.string().required('MP Height Units is required').default(''),

  MPDescription: Yup.string().required('MP Description is required').default(''),
  WellUse: Yup.string().required('Well Use is required').default(''),
  Status: Yup.string().required('Status is required').default(''),

  PhotoOverviewFrameNum: Yup.string().required('Photo Overview Frame Number is required').default(''),
  PhotoCloseupFrameNum: Yup.string().required('Photo Closeup Frame Number is required').default(''),

  SonicMeasurements: Yup.array()
    .of(
      Yup.object().shape({
        Type: Yup.string().oneOf(['normal', 'deep']).required('Sonic Measurement Type is required'),
        Measurement: Yup.number().required('Measurement is required'),
        MeasurementUnits: Yup.string().required('Measurement Units are required'),
        TemperatureSettings: Yup.string().required('Temperature Settings are required'),
      })
    )
    .optional()
    .default([]),

  SteelTapes: Yup.array()
    .of(
      Yup.object().shape({
        Hold: Yup.number().required('Hold is required'),
        HoldUnits: Yup.string().required('Hold Units are required'),
        Cut: Yup.number().required('Cut is required'),
        CutUnits: Yup.string().required('Cut Units are required'),
        DTW: Yup.number().required('DTW is required'),
        DTWUnits: Yup.string().required('DTW Units are required'),
        Time: Yup.mixed<Dayjs>().required('Time is required'),
        Notes: Yup.string().optional(),
      })
    )
    .optional()
    .default([]),
  EProbes: Yup.array().optional().default([]),

  SampleCollected: Yup.boolean().required().default(false),
  IsPossibleToSampleWell: Yup.boolean().required().default(false),
  SamplingScenario: Yup.string().optional().default(''),
  Comments: Yup.string().optional().default(''),
});


export const wellInventoryFormDefaults: IWellInventoryForm = {
  // General Section
  PointID: "",
  SiteName: "",
  DateTime: null as Dayjs | null, // Ensure it stays controlled
  FieldStaff: "",

  // Owner Data Section
  Owner: {
    Name: "",
    Phone: {
      Home: "",
      Cell: "",
      Work: "",
      Other: "",
    },
  },

  Address: {
    Physical: "",
    Mailing: "",
  },
  IsWellLocatedAtPhysicalAddress: false,
  Email: "",
  DirectionsToSite: "",
  LocationOfWell: "",

  OwnerGivePermissionFor: {
    RepeatMeasurements: false,
    SamplingInTheFuture: false,
    DataloggerInstallation: false,
  },
  DoesOwnerAcknowledgesDataWillBePubliclyAvailable: false,

  SpecialRequests: [],

  // Well Data Section
  Latitude: 0,
  Longitude: 0,
  Northing: 0,
  Easting: 0,
  Elevation: 0,
  ElevationUnits: "",
  ElevationDatum: "",
  ElevationSource: "",

  OSEWellRecord: "",
  DateDrilled: null as Dayjs | null, // Ensure it's correctly handled
  Source: [],

  WellTotalDepth: 0,
  WellTotalDepthUnits: "",

  HistoricDepthOfWater: 0,
  HistoricDepthOfWaterUnits: "",

  WellType: "",
  isDataloggerPossible: false,

  PumpDepth: 0,
  PumpDepthUnits: "",

  OuterCasingDiameter: 0,
  OuterCasingDiameterUnits: "",

  MPHeight: 0,
  MPHeightAboveOrBelowGround: false,
  MPHeightUnits: "",

  MPDescription: "",
  WellUse: "",
  Status: "",

  PhotoOverviewFrameNum: "",
  PhotoCloseupFrameNum: "",

  SonicMeasurements: [],
  SteelTapes: [],
  EProbes: [],

  SampleCollected: false,
  IsPossibleToSampleWell: false,
  SamplingScenario: "",
  Comments: "",
};

export default wellInventoryFormSchema;
// ============= EOF =============================================
