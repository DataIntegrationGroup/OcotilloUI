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


import {date} from "yup";

export interface IWellHeader {
    API: string;
    TotalDepth: number;

}

export interface IWell {
    OBJECTID: integer;
    // SiteID: string;
    // PublicRelease: boolean;
    // geometry: { coordinates: number[], type: string };
    // Easting: number;
    // Northing: number;
    // title: string;
    // status: IStatus;
    // category: ICategory;
    header: IWellHeader
}


export interface IWellRecord {
    API_suffix: string;
    ActionDate: string;
    Comments: string;
    EnteredBy: string;
    EntryDate: string;
    OBJECTID: string;
    RecrdSetID: string;
    SourceID: string;
    WellDataID: string;
    WellName: string;
    WellNumber: string;
}

export interface IBore {
    OBJECTID: integer;
    BoreUnits: string;
    BoreDia: number;
    FromDepth: number;
    ToDepth: number;
}

export interface ICasing {
    // CasDiaType: null
    // CasDiaUnit: null
    // CasDpthDrl: null
    // CasDpthLog: null
    // CasLenUnit: null
    CasingDiam: 8.625
    // CasingLen: null
    // CasingMtrl: null
    // CasingType: null
    // CasingWgt: null
    // CasngThick: null
    // CasngThkUn: null
    // CasngWgtUn: null
    // CmntRcd: null
    // Comments: null
    Depth: number
    // DepthType: null
    // GlobalID: "416fd1db-c442-428b-9be0-c5b33745f49d"
    OBJECTID: number
    RecrdsetID: string
    Sax: number
}

export interface IProduction {
    InitialProd: Date//(DateTime())
    Method: string//(String(24))
    ProdQual: string//(String(24))
    ChokeSize: number//(Float)
    ChokeQual: string//(String(24))
    ProdZone: string//(String(50))
    GOR: number//(Float)
    GORqual: string//(String(24))
    FTP: number//(Float)
    FTPmin: number//(Float)
    FTPmax: number//(Float)
    FTPunits: string//(String(4))
    SITP: number//(Float)
    SITPunits: string//(String(4))
    SICP: number//(Float)
    SICPunits: string//(String(4))
    CsgPress: number//(Float)
    CsgPressUn: string//(String(4))
    CsgPrsQual: string//(String(16))
    BOPD: number//(Float)
    BOPDqual: string//(String(8))
    TraceOil: number//(Integer)
    MCFGD: number//(Float)
    MillMCFGD: number//(Float)
    MCFGDqual: string//(String(8))
    BWD: number//(Float)
    BWDqual: string//(String(8))
    APIoilGrav: number//(Float)
    OilGravqu: string//(String(16))
    GasGrav: number//(Float)
    GasGravqu: string//(String(16))
    IP: string//(String(4))
    GasBTU: number//(Float)
    MiscInfo: string//(String)
}


export interface ILithStrat {
    LithClass: string
    UnitBasis: string
    UnitName: string
    GeoID: string
    WithinUnit: string
    Top_Qual: string
    Depth2Top: number
    Top_TVD: numbe
    Elev_Top: number
    Botm_Qual: string
    Depth2Botm: number
    Bottom_TVD: number
    Elev_Bot: number
    DpthMethod: string
    PickConfid: string
    Absent: number
    Overturned: number
    Duplicated: number
    Exclude: number
    CheckPick: number
    Int_Notes: string
}

export interface ILithLog {
    GeoID: string
    FromDepth: number
    Name: string
    ToDepth: number
    LithClass: string
    LithType: string
    IgneousCmp: string
    MMfacies: string
    Mineralogy: string
    PrimLith: string
    SecondLith: string
    ShortDesc: string
    UnitDesc: string
    Texture: string
    Color: string
    GrainSize: string
    Sorting: string
    Cemntation: string
    Induration: string
    Bedding: string
    BedThkness: number
    ThickUnits: string
    Protolith: string
    Comments: string
}

export interface ILogData {
    GeoID: string
    FromDepth: float
    Name: string
    ToDepth: float
    LithClass: string
    LithType: string
    IgneousCmp: string
    MMfacies: string
    Mineralogy: string
    PrimLith: string
    SecondLith: string
    ShortDesc: string
    UnitDesc: string
    Texture: string
    Color: string
    GrainSize: string
    Sorting: string
    Cemntation: string
    Induration: string
    Bedding: string
    BedThkness: float
    ThickUnits: string
    Protolith: string
    Comments: string
}

export interface IHistory {
    ActionClss: string // Column(String(16))
    WorkType: string // Column(String(16))
    ActionDate: date // Column(DateTime)
    SpudDate: date // Column(DateTime)
    Commodity: string // Column(String(16))
    PlugBack: number // Column(Float)
    BridgePlug: string // Column(String(50))
    TotalDepth: number // Column(Float)
    Results: string // Column(String(16))
    LeaseID: string // Column(String(128))
    Operator: string // Column(String(50))
    Contractor: string // Column(String(50))
    Driller: string // Column(String(50))
    Status: string // Column(String(16))

}

// ============= EOF =============================================
