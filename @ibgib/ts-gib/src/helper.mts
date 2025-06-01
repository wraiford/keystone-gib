import { Ib, Gib, IbGib, IbGibAddr, IbAndGib } from './types.mjs';


/**
 * Gets the ib^gib address from the given ib and gib or
 * from the ibGib object.
 *
 * Need to refactor to getIbGibAddr
 */
export function getIbGibAddr({
    ib, gib, ibGib, delimiter = '^'
}: {
    ib?: Ib,
    gib?: Gib,
    ibGib?: IbGib,
    delimiter?: string
}): IbGibAddr {
    ib = ib || ibGib?.ib || '';
    gib = gib || ibGib?.gib || '';
    return ib + delimiter + gib;
}

/**
 * Get the ib and gib fields from an ibGib object or ibGibAddr
 * with the given `delimiter`.
 */
export function getIbAndGib({
    ibGib,
    ibGibAddr,
    delimiter = '^'
}: {
    ibGibAddr?: IbGibAddr,
    ibGib?: IbGib,
    delimiter?: string
}): IbAndGib {
    const lc = '[getIbAndGib]';
    if (!ibGibAddr) {
        if (ibGib) {
            ibGibAddr = getIbGibAddr({ ibGib });
        } else {
            throw new Error(`${lc} We need either an address or an ibGib object`);
        }
    }
    if (!ibGibAddr) { throw new Error(`${lc} Couldn't get ibGibAddr. ibGib invalid?`); }

    if (!delimiter) { delimiter = '^'; }

    const pieces = ibGibAddr.split(delimiter);
    if (pieces.length === 2) {
        // normal v1 case, e.g. 'ib^gib' or 'tag home^ABC123'
        return { ib: pieces[0], gib: pieces[1] };
    } else if (pieces.length === 1 && ibGibAddr.endsWith(delimiter)) {
        // normal v1 primitive, e.g. '7^' or 'name^'
        return { ib: pieces[0], gib: '' };
    } else if (pieces.length === 1 && ibGibAddr.startsWith(delimiter)) {
        // only gib/hash is provided like maybe a binary file
        // e.g. ^ABC123 or ^XYZ456 or ^some_gib_that_isnt_a_hash
        return { ib: '', gib: pieces[0] };
    } else if (pieces.length === 2 && pieces[0] === '' && pieces[1] === '') {
        // edge case of address is only the delimiter.
        // So it's the primitive for that delimiter
        return { ib: delimiter, gib: '' };
        // } else if (pieces.length === 0 ) {
        // ibGibAddr is falsy, so would have thrown earlier in this function
        // I'm just noting this case for intent ATOW
    } else {
        console.warn(`${lc} multiple delimiters found in ibGibAddr. Considering last delimiter as the demarcation of gib hash`);
        // e.g. 'ib^ABC123^gib'
        // ib: 'ib^ABC123'
        // gib: 'gib'
        return {
            ib: pieces.slice(0, pieces.length - 1).join(delimiter),
            gib: pieces.slice(pieces.length - 1)[0],
        }
    }
}


/**
 * Normalizes an object/value for consistent hashing.
 * - Recursively processes objects and arrays.
 * - For objects:
 *   - Sorts keys alphabetically.
 *   - Removes properties whose values are `undefined`.
 *   - Keeps properties whose values are `null`.
 * - For arrays:
 *   - Preserves element order.
 *   - Recursively normalizes each element.
 * - Primitives (strings, numbers, booleans) and `null` are returned as is.
 *
 * @param value The value to normalize.
 * @returns The normalized value.
 *
 * This has been adjusted due to conversation with Gemini and working on python
 * port.  The main thing here is that we normalize array members, but not the
 * array itself. This way the array's order is preserved, but any object members
 * are themselves normalized.
 */
export function toNormalizedForHashing(value: any): any {
    // Handle null, primitives (string, number, boolean) directly.
    // `undefined` at the top level will be handled by the caller or become part of an object/array.
    if (value === null || typeof value !== 'object') {
        return value;
    }

    // Handle Arrays: recursively normalize elements, preserve order
    if (Array.isArray(value)) {
        return value.map(element => toNormalizedForHashing(element));
    }

    // Handle Objects (plain objects)
    const normalizedObject: { [key: string]: any } = {};
    const sortedKeys = Object.keys(value).sort();

    for (const key of sortedKeys) {
        const propertyValue = value[key];
        if (propertyValue !== undefined) { // CRITICAL: Only omit if value is undefined
            normalizedObject[key] = toNormalizedForHashing(propertyValue);
        }
        // If propertyValue is undefined, it's omitted from normalizedObject.
        // If propertyValue is null, it's included.
    }
    return normalizedObject;
}
