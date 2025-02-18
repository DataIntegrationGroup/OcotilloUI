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
    LithClass: string //= Column(String(50))
    UnitBasis: string //= Column(String(16))
    UnitName: string //= Column(String(128))
    GeoID: string //= Column(String(16))
    WithinUnit: string //= Column(String(16))
    Top_Qual: string //= Column(String(3))
    Depth2Top: number //= Column(Float)
    Top_TVD: number//= Column(Float)
    Elev_Top: number //= Column(Float)
    Botm_Qual: string //= Column(String(3))
    Depth2Botm: number //= Column(Float)
    Bottom_TVD: number //= Column(Float)
    Elev_Bot: number  //= Column(Float)
    DpthMethod: string //= Column(String(16))
    PickConfid: string //= Column(String(16))
    Absent: number//= Column(Integer)
    Overturned: number //= Column(Integer)
    Duplicated: number  //= Column(Integer)
    Exclude: number //= Column(Integer)
    CheckPick: number //= Column(Integer)
    Int_Notes: string //= Column(String(255))
}

// ============= EOF =============================================
