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



export interface ILocation {
    PointID: string;
    SiteID: string;
    PublicRelease: boolean;
    geometry: { coordinates: number[], type: string };
    Easting: number;
    Northing: number;
    site_type: string;
    // title: string;
    // status: IStatus;
    // category: ICategory;
}

export interface IWell {
    PointID: string;

    formation: string;
    construction_notes: string

    casing_depth_ftbgs: number
    casing_description: string
    casing_diameter_ft: number

    hole_depth_ftbgs: number
    measuring_point: string
    measuring_point_height_ft: number
    measuring_point_height_ftin: string
    monitoring_status: string
    notes: string
    ose_well_id: string
    ose_welltag_id: string
    screens: string
    static_water_level_ftbgs: number
    well_depth_ftbgs: number
}

export interface ILookupTable {
    Code: string;
    Meaning: string;
}

export interface IManualWaterLevel {
    PointID: string;
    PublicRelease: boolean;
    MeasurementDate: string;
    DepthToWaterBGS: number;
    MeasuringAgency: string;
    LevelStatus: string;
    DataQuality: string;
    DataSource: string;
    MeasuredBy: string;
    SiteNotes: string;
}

export interface IMeasuringAgency {
    Agency: string;
    Description: string;
    id: number;
}

export interface IEquipment {
    ID: number;
    PointID: string;
    EquipmentType: string;
    Model: string;
    SerialNo: string;
    DateInstalled: string;
    DateRemoved: string;
}

export interface IProject {
    Project: string
    PointIDPrefix: string
}
// ============= EOF =============================================
