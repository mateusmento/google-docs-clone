import {
  listDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
} from "./documents";
import { listShares, addShare, removeShare } from "./shares";

export const api = {
  documents: {
    list: listDocuments,
    create: createDocument,
    update: updateDocument,
    delete: deleteDocument,
  },
  shares: {
    list: listShares,
    add: addShare,
    remove: removeShare,
  },
};
