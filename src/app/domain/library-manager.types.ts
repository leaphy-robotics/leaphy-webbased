interface BaseLibrary {
    architectures: string[];
    archiveFileName: string;
    author: string;
    category: string;
    checksum: string;
    maintainer: string;
    name: string;
    paragraph?: string;
    repository: string;
    sentence: string;
    size: number;
    types: string[];
    url: string;
    website: string;
}

export interface Library extends BaseLibrary {
    versions: string[];
}

export interface LibraryResponse {
    libraries: (BaseLibrary & { version: string })[];
}

export interface AnnotatedLibrary extends Library {
    installed?: string;
}

export interface InstalledLibrary extends BaseLibrary {
    version: string;
}
