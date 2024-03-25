export const aliases = {
    '7_SIBLINGS':       '7 Siblings',
    ANTALPHA:           'Antalpha',
    CZSAMSUNSB_ETH:     'czsamsunsb.eth',
    F2POOL:             'F2Pool',
    INSTADAPP_LITE:     'InstaDapp Lite',
    KARPATKEY:          'Karpatkey',
    MAKER_CORE_D3M:     'Maker Core D3M',
    MONEYPRINTER1:      'MoneyPrinter1',
    NEXO:               'Nexo',
    NEXUS_MUTUAL:       'Nexus Mutual',
    ONETHOUSAN_ETH:     'onethousand.eth',
    PHOENIX_LABS:       'Phoenix Labs',
    SAMYAK:             'Samyak',
    SATOFISHI:          'Satofishi',
    SUMMER_FI:          'summer.fi',
    WETH_TOKEN_GATEWAY: 'WETH Gateway',
} as const

export const getAddressAlias = (address: string): string | null => {
    const aliasesRegistry = {
        '0xafa2dd8a0594b2b24b59de405da9338c4ce23437': aliases.MAKER_CORE_D3M,
        '0xbd7d6a9ad7865463de44b05f04559f65e3b11704': aliases.WETH_TOKEN_GATEWAY,
        '0xaa1582084c4f588ef9be86f5ea1a919f86a3ee57': aliases.CZSAMSUNSB_ETH,
        '0x4353e2df4e3444e97e20b2bda165bdd9a23913ab': aliases.ANTALPHA,
        '0x8af700ba841f30e0a3fcb0ee4c4a9d223e1efa05': aliases.NEXUS_MUTUAL,
        '0xd007058e9b58e74c33c6bf6fbcd38baab813cbb6': aliases.SATOFISHI,
        '0x28a55c4b4f9615fde3cdaddf6cc01fcf2e38a6b0': aliases['7_SIBLINGS'],
        '0xf8de75c7b95edb6f1e639751318f117663021cf0': aliases['7_SIBLINGS'],
        '0x741aa7cfb2c7bf2a1e7d4da2e3df6a56ca4131f3': aliases['7_SIBLINGS'],
        '0x3a0dc3fc4b84e2427ced214c9ce858ea218e97d9': aliases['7_SIBLINGS'],
        '0x56aa33f20e25baa99e916c91abb4f59ae72491e0': aliases.ONETHOUSAN_ETH,
        '0x171c53d55b1bcb725f660677d9e8bad7fd084282': aliases.MONEYPRINTER1,
        '0x849d52316331967b6ff1198e5e32a0eb168d039d': aliases.KARPATKEY,
        '0x19891541842162ad4311f14055e7221406213d67': aliases.PHOENIX_LABS,
        '0xf20b338752976878754518183873602902360704': aliases.F2POOL,
        '0x9600a48ed0f931d0c422d574e3275a90d8b22745': aliases.INSTADAPP_LITE,
        '0xa7615cd307f323172331865181dc8b80a2834324': aliases.SAMYAK,
        '0x74ac14c85b2c338e6b9b5386138bd7a6f2f428c8': aliases.SUMMER_FI,
        '0x43fC188f003e444e9e538189Fc675acDfB8f5d12': aliases.NEXO,
    } as Record<string, string>

    return aliasesRegistry[address.toLowerCase()] || null
}
