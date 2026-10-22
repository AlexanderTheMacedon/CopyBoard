import { createLibrary, type ReadOnlyLibrary } from '../domain/library';
import { fixtureItems } from './items';
import { fixtureCollections, fixtureSpaces } from './spaces';

/** The only data source of the preview: synthetic, in-memory, read-only. */
export const fixtureLibrary: ReadOnlyLibrary = createLibrary(fixtureSpaces, fixtureItems, fixtureCollections);
