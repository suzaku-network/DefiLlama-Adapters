const { chainExports } = require("../helper/exports");
const { sumTokens } = require("../helper/unwrapLPs");
const { getFixBalances } = require('../helper/portedTokens')
const ethers = require("ethers")
const { config } = require('@defillama/sdk/build/api');

const bridgeContractV1 = "0x841ce48F9446C8E281D3F1444cB859b4A6D0738C";
config.setProvider("clv", new ethers.providers.StaticJsonRpcProvider(
  "https://api-para.clover.finance",
  {
    name: "clv",
    chainId: 1024,
  }
))

config.setProvider("syscoin", new ethers.providers.StaticJsonRpcProvider(
  "https://rpc.ankr.com/syscoin",
  {
    name: "syscoin",
    chainId: 57,
  }
))

// Bridge and token contract addresses are taken from https://cbridge-docs.celer.network/reference/contract-addresses
const liquidityBridgeContractsV2 = {
  // NOTE: Some chains have addresses before and after the liquidity bridge upgrade / migration
  arbitrum: [
    "0xdd90E5E87A2081Dcf0391920868eBc2FFB81a1aF",
    "0x1619DE6B6B20eD217a58d00f37B9d47C7663feca",
    "0xFe31bFc4f7C9b69246a6dc0087D91a91Cb040f76",
    "0xEA4B1b0aa3C110c55f650d28159Ce4AD43a4a58b",
  ],
  astar: ["0x841ce48F9446C8E281D3F1444cB859b4A6D0738C"],
  aurora: ["0x841ce48F9446C8E281D3F1444cB859b4A6D0738C", "0xbCfeF6Bb4597e724D720735d32A9249E0640aA11",],
  avax: [
    "0xBB7684Cc5408F4DD0921E5c2Cadd547b8f1AD573",
    "0xef3c714c9425a8F3697A9C969Dc1af30ba82e5d4",
    "0x5427FEFA711Eff984124bFBB1AB6fbf5E3DA1820",
    "0xb51541df05DE07be38dcfc4a80c05389A54502BB",
  ],
  boba: ["0x841ce48F9446C8E281D3F1444cB859b4A6D0738C", '0x8db213bE5268a2b8B78Af08468ff1EA422073Da0', '0x4C882ec256823eE773B25b414d36F92ef58a7c0C'],
  bsc: [
    "0x5d96d4287D1ff115eE50faC0526cf43eCf79bFc6",
    "0xdd90E5E87A2081Dcf0391920868eBc2FFB81a1aF",
    "0x78bc5Ee9F11d133A08b331C2e18fE81BE0Ed02DC",
    "0x11a0c9270D88C99e221360BCA50c2f6Fda44A980",
  ],
  celo: ["0xBB7684Cc5408F4DD0921E5c2Cadd547b8f1AD573", '0xD9d1034ef3d21221F008C7e96346CA999966752C'],
  clv: ["0x841ce48F9446C8E281D3F1444cB859b4A6D0738C"],
  conflux: ["0x841ce48F9446C8E281D3F1444cB859b4A6D0738C"],
  ethereum: [
    "0xc578Cbaf5a411dFa9F0D227F97DaDAa4074aD062",
    "0x5427FEFA711Eff984124bFBB1AB6fbf5E3DA1820",
    "0xb37d31b2a74029b5951a2778f959282e2d518595",
    "0x7510792A3B1969F9307F3845CE88e39578f2bAE1",
  ],
  fantom: [
    "0x3795C36e7D12A8c252A20C5a7B455f7c57b60283",
    "0x374B8a9f3eC5eB2D97ECA84Ea27aCa45aa1C57EF",
    "0x7D91603E79EA89149BAf73C9038c51669D8F03E9",
  ],
  harmony: ["0x78a21C1D3ED53A82d4247b9Ee5bF001f4620Ceec"],
  heco: ["0xBB7684Cc5408F4DD0921E5c2Cadd547b8f1AD573", "0x5d96d4287D1ff115eE50faC0526cf43eCf79bFc6"],
  metis: ["0x841ce48F9446C8E281D3F1444cB859b4A6D0738C"],
  milkomeda: ["0x841ce48F9446C8E281D3F1444cB859b4A6D0738C"],
  moonbeam: ["0x841ce48F9446C8E281D3F1444cB859b4A6D0738C"],
  moonriver: ["0x841ce48F9446C8E281D3F1444cB859b4A6D0738C"],
  oasis: ["0x841ce48F9446C8E281D3F1444cB859b4A6D0738C"],
  okexchain: ["0x6a2d262D56735DbA19Dd70682B39F6bE9a931D98"],
  optimism: [
    "0x6De33698e9e9b787e09d3Bd7771ef63557E148bb",
    "0x9D39Fc627A6d9d9F8C831c16995b209548cc3401",
    "0xbCfeF6Bb4597e724D720735d32A9249E0640aA11",
  ],
  polygon: [
    "0xa251c4691C1ffd7d9b128874C023427513D8Ac5C",
    "0x88DCDC47D2f83a99CF0000FDF667A468bB958a78",
    "0xc1a2D967DfAa6A10f3461bc21864C23C1DD51EeA",
  ],
  rei: ["0x841ce48F9446C8E281D3F1444cB859b4A6D0738C"],
  shiden: ["0x841ce48F9446C8E281D3F1444cB859b4A6D0738C", "0xBB7684Cc5408F4DD0921E5c2Cadd547b8f1AD573",],
  syscoin: ["0x841ce48F9446C8E281D3F1444cB859b4A6D0738C", "0x1E6b1ceAF75936f153ABB7B65FBa57AbaE14e6CE"],
  xdai: ["0x3795C36e7D12A8c252A20C5a7B455f7c57b60283"],
};

// Tokens added to the liquidity bridges, excluding Celer-Pegged tokens.
const liquidityBridgeTokens = [
  {
    // USDT
    arbitrum: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    aurora: "0x4988a896b1227218e4A686fdE5EabdcAbd91571f",
    avax: "0xc7198437980c041c805A1EDcbA50c1Ce5db95118",
    bsc: "0x55d398326f99059ff775485246999027b3197955",
    ethereum: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    fantom: "0x049d68029688eabf473097a2fc38ef61633a3c7a",
    heco: "0xa71edc38d189767582c38a3145b5873052c3e47a",
    okexchain: "0x382bb369d343125bfb2117af9c149795c6c65c50",
    optimism: "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58",
    polygon: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
    xdai: "0x4ECaBa5870353805a9F068101A40E0f32ed605C6",
  },
  {
    // USDC
    arbitrum: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
    aurora: "0xB12BFcA5A55806AaF64E99521918A4bf0fC40802",
    avax: "0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664",
    boba: "0x66a2A913e447d6b4BF33EFbec43aAeF87890FBbc",
    bsc: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
    ethereum: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    fantom: "0x04068da6c83afcfa0e13ba15a6696662335d5b75",
    harmony: "0x985458e523db3d53125813ed68c274899e9dfab4",
    heco: "0x9362bbef4b8313a8aa9f0c9808b80577aa26b73b",
    okexchain: "0xc946daf81b08146b1c7a8da2a851ddf2b3eaaf85",
    optimism: "0x7f5c764cbc14f9669b88837ca1490cca17c31607",
    polygon: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
    xdai: "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83",
  },
  {
    // BUSD
    ethereum: "0x4fabb145d64652a948d72533023f6e7a623c7c53",
    bsc: "0xe9e7cea3dedca5984780bafc599bd69add087d56",
  },
  {
    // DAI
    avax: "0xd586E7F844cEa2F87f50152665BCbc2C279D8d70",
    bsc: "0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3",
    ethereum: "0x6b175474e89094c44da98b954eedeac495271d0f",
    optimism: "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1",
    polygon: "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
  },
  {
    // WETH
    arbitrum: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    avax: "0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB",
    bsc: "0x2170ed0880ac9a755fd29b2688956bd959f933f8",
    ethereum: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    fantom: "0x74b23882a30290451A17c44f4F05243b6b58C76d",
    optimism: "0x4200000000000000000000000000000000000006",
    polygon: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
  },
  {
    // WBTC
    arbitrum: "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f",
    avax: "0x50b7545627a5162F82A992c33b87aDc75187B218",
    ethereum: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
    fantom: "0x321162Cd933E2Be498Cd2267a90534A804051b11",
    polygon: "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6",
  },
  {
    // DODO
    arbitrum: "0x69eb4fa4a2fbd498c257c57ea8b7655a2559a581",
    bsc: "0x67ee3cb086f8a16f34bee3ca72fad36f7db929e2",
    ethereum: "0x43Dfc4159D86F3A37A5A4B3D4580b888ad7d4DDd",
  },
  {
    // MCB
    arbitrum: "0x4e352cf164e64adcbad318c3a1e222e9eba4ce42",
    ethereum: "0x4e352cF164E64ADCBad318C3a1e222E9EBa4Ce42",
  },
  {
    // CELR
    arbitrum: "0x3a8B787f78D775AECFEEa15706D4221B40F345AB",
    bsc: "0x1f9f6a696c6fd109cd3956f45dc709d2b3902163",
    ethereum: "0x4f9254c83eb525f9fcf346490bbb3ed28a81c667",
  },
  {
    // IF
    bsc: "0xb0e1fc65c1a741b4662b813eb787d369b8614af1",
    ethereum: "0xb0e1fc65c1a741b4662b813eb787d369b8614af1",
  },
  {
    // LYRA
    ethereum: "0x01ba67aac7f75f647d94220cc98fb30fcc5105bf",
    optimism: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
  },
  {
    // IMX
    arbitrum: "0x9c67ee39e3c4954396b9142010653f17257dd39c",
    avax: "0xeA6887e4a9CdA1B77E70129E5Fba830CdB5cdDef",
    ethereum: "0x7b35ce522cb72e4077baeb96cb923a5529764a00",
    harmony: "0xbd8064cdb96c00a73540922504f989c64b7b8b96",
    moonriver: "0x900f1Ec5819FA087d368877cD03B265Bf1802667",
    polygon: "0x60bb3d364b765c497c8ce50ae0ae3f0882c5bd05",
  },
  {
    // DOMI
    ethereum: "0x45C2F8c9B4c0bDC76200448cc26C48ab6ffef83F",
  },
  {
    // BOBA
    boba: "0xa18bF3994C0Cc6E3b63ac420308E5383f53120D7",
    ethereum: "0x42bbfa2e77757c645eeaad1655e0911a7553efbc",
  },
  {
    // XTK
    arbitrum: "0xF0A5717Ec0883eE56438932b0fe4A20822735fBa",
    ethereum: "0x7f3edcdd180dbe4819bd98fee8929b5cedb3adeb",
  },
  {
    // xXTKa
    arbitrum: "0xd8083e393985530b7cf6798d44a2f1536e211ab6",
    ethereum: "0x314022E24ceD941781DC295682634B37Bd0d9cFc",
  },
  {
    // METIS
    ethereum: "0x9e32b13ce7f2e80a01932b42553652e053d6ed8e",
    metis: "0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000",
  },
  {
    // CVP
    bsc: "0x5ec3adbdae549dce842e24480eb2434769e22b2e",
    ethereum: "0x38e4adb44ef08f22f5b5b76a8f0c2d0dcbe7dca1",
  },
  {
    // CEC
    bsc: "0x957c49a76b3e008637ca1cce23188a8ce884911e",
    ethereum: "0x9e564eb5550E1A9b1448D916fd85a8d876661bdC",
  },
  {
    // STND
    ethereum: "0x9040e237c3bf18347bb00957dc22167d0f2b999d",
    metis: "0xc12caC7090baa48Ec750CceeC57C80768F6ee58E",
  },
  {
    // WOO
    arbitrum: "0xcafcd85d8ca7ad1e1c6f82f651fa15e33aefd07b",
    avax: "0xabc9547b534519ff73921b1fba6e672b5f58d083",
    bsc: "0x4691937a7508860f876c9c0a2a617e7d9e945d4b",
    ethereum: "0x4691937a7508860f876c9c0a2a617e7d9e945d4b",
    fantom: "0x6626c47c00f1d87902fc13eecfac3ed06d5e8d8a",
    polygon: "0x1B815d120B3eF02039Ee11dC2d33DE7aA4a8C603",
  },
  {
    // DF
    arbitrum: "0xaE6aab43C4f3E0cea4Ab83752C278f8dEbabA689",
    bsc: "0x4a9a2b2b04549c3927dd2c9668a5ef3fca473623",
    ethereum: "0x431ad2ff6a9c365805ebad47ee021148d6f7dbe0",
    optimism: "0x9e5AAC1Ba1a2e6aEd6b32689DFcF62A509Ca96f3",
    polygon: "0x08C15FA26E519A78a666D19CE5C646D55047e0a3",
  },
  {
    // USX
    arbitrum: "0x641441c631e2F909700d2f41FD87F0aA6A6b4EDb",
    bsc: "0xb5102cee1528ce2c760893034a4603663495fd72",
    ethereum: "0x0a5e677a6a24b2f1a2bf4f3bffc443231d2fdec8",
    optimism: "0xbfD291DA8A403DAAF7e5E9DC1ec0aCEaCd4848B9",
    polygon: "0xCf66EB3D546F0415b368d98A95EAF56DeD7aA752",
  },
  {
    // PERP
    arbitrum: "0x753d224bcf9aafacd81558c32341416df61d3dac",
    bsc: "0x4e7f408be2d4e9d60f49a64b89bb619c84c7c6f5",
    ethereum: "0xbc396689893d065f41bc2c6ecbee5e0085233447",
    optimism: "0x9e1028f5f1d5ede59748ffcee5532509976840e0",
  },
  {
    // KROM
    arbitrum: "0x55ff62567f09906a85183b866df84bf599a4bf70",
    ethereum: "0x3af33bef05c2dcb3c7288b77fe1c8d2aeba4d789",
    optimism: "0xf98dcd95217e15e05d8638da4c91125e59590b07",
    polygon: "0x14Af1F2f02DCcB1e43402339099A05a5E363b83c",
  },
  {
    // TCR
    arbitrum: "0xa72159fc390f0e3c6d415e658264c7c4051e9b87",
    ethereum: "0x9c4a4204b79dd291d6b6571c5be8bbcd0622f050",
  },
  {
    // PKEX
    ethereum: "0xe6f143a0e0a8f24f6294ce3432ea10fad0206920",
  },
  {
    // ZLK
    moonbeam: "0x3fd9b6c9a24e09f67b7b706d72864aebb439100c",
    moonriver: "0x0f47ba9d9bde3442b42175e51d6a367928a1173b",
  },
  {
    // PERL
    bsc: "0x0f9e4d49f25de22c2202af916b681fbb3790497b",
    ethereum: "0xeca82185adce47f39c684352b0439f030f860318",
  },
  {
    // BMI
    bsc: "0x3e1b4Ff4AE3Ab8f0Cb40a34a6ad3fC817F7dA2b6",
    ethereum: "0x725c263e32c72ddc3a19bea12c5a0479a81ee688",
    polygon: "0x3e1b4Ff4AE3Ab8f0Cb40a34a6ad3fC817F7dA2b6",
  },
  {
    // JPEG
    avax: "0x6241af3817Db48a7F9E19FD9446d78E50936d275",
    bsc: "0x4bfce5a1acc3b847afa9579ba91da33b08e66fb7",
    ethereum: "0x4bfce5a1acc3b847afa9579ba91da33b08e66fb7",
  },
  {
    // MASK
    bsc: "0x2eD9a5C8C13b93955103B9a7C167B67Ef4d568a3",
    ethereum: "0x69af81e73A73B40adF4f3d4223Cd9b1ECE623074",
  },
  {
    // REEF
    bsc: "0xF21768cCBC73Ea5B6fd3C687208a7c2def2d966e",
    ethereum: "0xFE3E6a25e6b192A42a44ecDDCd13796471735ACf",
  },
  {
    // THALES
    ethereum: "0x8947da500Eb47F82df21143D0C01A29862a8C3c5",
    optimism: "0x217D47011b23BB961eB6D93cA9945B7501a5BB11",
  },
  {
    // TORN
    bsc: "0x1ba8d3c4c219b124d351f603060663bd1bcd9bbf",
    ethereum: "0x77777FeDdddFfC19Ff86DB637967013e6C6A116C",
  },
  {
    // HUH
    bsc: "0xc15e89f2149bCC0cBd5FB204C9e77fe878f1e9b2",
    ethereum: "0x86D49fbD3B6f989d641E700a15599d3b165002AB",
    polygon: "0x08648471B5AAd25fEEeb853d6829048f3Fc37786",
  },
  {
    // iZi
    arbitrum: "0x60D01EC2D5E98Ac51C8B4cF84DfCCE98D527c747",
    bsc: "0x60D01EC2D5E98Ac51C8B4cF84DfCCE98D527c747",
    ethereum: "0x9ad37205d608B8b219e6a2573f922094CEc5c200",
  },
  {
    // ESW
    astar: "0xb361DAD0Cc1a03404b650A69d9a5ADB5aF8A531F",
    aurora: "0xd2Fa7C9386040f260e3Ec934601982aD4Cd7902B",
    ethereum: "0x5a75A093747b72a0e14056352751eDF03518031d",
    polygon: "0xd2A2a353D28e4833FAFfC882f6649c9c884a7D8f",
    shiden: "0xb4BcA5955F26d2fA6B57842655d7aCf2380Ac854",
  },
  {
    // ASVA
    bsc: "0xF7b6d7E3434cB9441982F9534E6998C43eEF144a",
    polygon: "0xE7E0bA6f84D843d17Cb8410810Bf3E8Bcda0caA1",
  },
  {
    // ANML
    ethereum: "0x38B0e3A59183814957D83dF2a97492AED1F003e2",
    polygon: "0xEcc4176B90613Ed78185f01bd1E42C5640C4F09d",
  },
  {
    // GOVI
    arbitrum: "0x07E49d5dE43DDA6162Fa28D24d5935C151875283",
    ethereum: "0xeEAA40B28A2d1b0B08f6f97bB1DD4B75316c6107",
    polygon: "0x43Df9c0a1156c96cEa98737b511ac89D0e2A1F46",
  },
  {
    // PEOPLE
    ethereum: "0x7a58c0be72be218b41c608b7fe7c5bb630736c71",
  },
  {
    // SOS
    ethereum: "0x3b484b82567a09e2588a13d54d032153f0c0aee0",
  },
  {
    // OLO
    boba: "0x5008F837883EA9a07271a1b5eB0658404F5a9610",
  },
  {
    // oneDODO
    ethereum: "0xcA37530E7c5968627BE470081d1C993eb1dEaf90",
  },
  {
    // cUSD
    celo: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
  },
  {
    // WSYS
    // origin: "syscoin:0xd3e822f3ef011Ca5f17D82C956D952D8d7C3A1BB",
    syscoin: "0xd3e822f3ef011Ca5f17D82C956D952D8d7C3A1BB",
    bsc: "0x6822A778726CD2f0d4A1Cfaca2D04654e575cC82",
    ethereum: "0xF3C96924d85566C031ddc48DbC63B2d71da6D0f6",
  },
  {
    // PSP
    ethereum: "0xcAfE001067cDEF266AfB7Eb5A286dCFD277f3dE5",
    bsc: "0xcAfE001067cDEF266AfB7Eb5A286dCFD277f3dE5",
  },
  {
    // WXT
    ethereum: "0xa02120696c7b8fe16c09c749e4598819b2b0e915",
  },
  {
    // FRAX
    ethereum: "0x853d955acef822db058eb8505911ed77f175b99e",
  },
  {
    // FXS
    ethereum: "0x3432B6A60D23Ca0dFCa7761B7ab56459D9C964D0",
  },
  {
    // MAI
    polygon: "0xa3fa99a148fa48d14ed51d610c367c61876997f1",
  },
  {
    // ATL
    bsc: "0x1fD991fb6c3102873ba68a4e6e6a87B3a5c10271",
  },
  {
    // BNB
    bsc: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  },
  {
    // AVAX
    avax: "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7",
  },
  {
    // FTM
    fantom: "0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83",
  },
  {
    // AMY
    arbitrum: "0x8fbd420956fdd301f4493500fd0bcaaa80f2389c",
  },
  {
    // GHX
    ethereum: "0x728f30fa2f100742c7949d1961804fa8e0b1387d",
  },
  {
    // SAFLE
    polygon: "0x04b33078ea1aef29bf3fb29c6ab7b200c58ea126",
  },
  {
    // WREVA
    bsc: "0xec81aa154d470c6857219b529de3f1d755ee2ae7",
  },
  {
    // MARK
    heco: "0x779a8134750809F79Cf0Ba48ee0fF1A5c41a8fDC",
  },
  {
    // PLATO
    heco: "0x4668e0E7cC545De886aBF038067F81cD4DC0924b",
  },
  {
    // SDN
    // origin: "shiden:0x0f933dc137d21ca519ae4c7e93f87a4c8ef365ef",
    shiden: "0x0f933dc137d21ca519ae4c7e93f87a4c8ef365ef",
  },
  {
    // CONV
    ethereum: "0xc834fa996fa3bec7aad3693af486ae53d8aa8b50",
  },
  {
    // TSD
    avax: "0x4fbf0429599460d327bd5f55625e30e4fc066095",
  },
  {
    // MATIC
    polygon: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
  },
  {
    // AAVE
    ethereum: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
  },
  {
    // CRV
    ethereum: "0xD533a949740bb3306d119CC777fa900bA034cd52",
  },
  {
    // AVG
    ethereum: "0xa41f142b6eb2b164f8164cae0716892ce02f311f",
  },
  {
    // AELIN
    optimism: "0x61baadcf22d2565b0f471b291c475db5555e0b76",
  },
  {
    // CGG
    ethereum: "0x1fe24f25b1cf609b9c4e7e12d802e3640dfa5e43",
  },
  {
    // REVA
    bsc: "0x4FdD92Bd67Acf0676bfc45ab7168b3996F7B4A3B",
  },
  {
    // IMX
    ethereum: "0x7b35ce522cb72e4077baeb96cb923a5529764a00",
  },
  {
    // WAGMIv1
    boba: "0xCe055Ea4f29fFB8bf35E852522B96aB67Cbe8197",
  },
  {
    // LUSD
    ethereum: "0x5f98805A4E8be255a32880FDeC7F6728C6568bA0",
  },
  {
    // JONES
    arbitrum: "0x10393c20975cF177a3513071bC110f7962CD67da",
  },
  {
    // SWAY
    polygon: "0x262B8AA7542004f023B0eB02bc6b96350A02b728",
  },
  {
    // JADE
    bsc: "0x7ad7242A99F21aa543F9650A56D141C57e4F6081",
  },
  {
    // MELOS
    ethereum: "0x1afb69DBC9f54d08DAB1bD3436F8Da1af819E647",
  },
  {
    // MSU
    ethereum: "0xdfD8D604951eBF1b2297285F1B68de140C43992b",
  },
  {
    // UCG
    ethereum: "0x7D92a06808B4c4833623F809218ed403e4A85FE1",
  },
  {
    // MGH
    ethereum: "0x8765b1A0eb57ca49bE7EACD35b24A574D0203656",
  },
  {
    // ASTR
    astar: "0xAeaaf0e2c81Af264101B9129C00F4440cCF0F720",
  },
  {
    // ANML
    ethereum: "0x38B0e3A59183814957D83dF2a97492AED1F003e2",
  },
  {
    // BLANK
    ethereum: "0x41A3Dba3D677E573636BA691a70ff2D606c29666",
  },
];

function chainTvl(chain) {
  return async (time, _, {[chain]: block}) => {
    const toa = []
    liquidityBridgeTokens.forEach(token => {
      if (!token[chain])
        return;
      toa.push([token[chain], bridgeContractV1])
      if (liquidityBridgeContractsV2[chain])
        liquidityBridgeContractsV2[chain].filter(owner => owner.toLowerCase() !== bridgeContractV1.toLowerCase())
          .forEach(owner => toa.push([token[chain], owner]))
    })
    const balances = await sumTokens({}, toa, block, chain)
    const fixBalances = await getFixBalances(chain)
    fixBalances(balances)
    return balances
  };
}

let chains = liquidityBridgeTokens.reduce((allChains, token) => {
  Object.keys(token).forEach((key) => allChains.add(key));
  return allChains;
}, new Set());

Object.keys(liquidityBridgeContractsV2).forEach(chain => chains.add(chain))
module.exports = chainExports(chainTvl, Array.from(chains));
module.exports.methodology = `Tokens bridged via cBridge are counted as TVL`;
module.exports.misrepresentedTokens = true;
module.exports.hallmarks = [
  [1651881600, "UST depeg"],
];
