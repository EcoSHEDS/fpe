const express = require('express')
const asyncHandler = require('express-async-handler')

const {
  attachStation,
  getPublicStations,
  getStation,
  postStations,
  putStation,
  deleteStation,
  getStationDaily,
  addUserPermission,
  removeUserPermission,
  getStationPermissions,
  getStationRandomImagePairs
} = require('../../controllers/stations')
const {
  attachDataset,
  getDatasets,
  getDataset,
  postDatasets,
  putDataset,
  deleteDataset,
  processDataset,
  listDatasetFiles
} = require('../../controllers/datasets')
const {
  attachRestrictedImageset,
  getImagesets,
  getImageset,
  postImagesets,
  presignImageset,
  putImageset,
  deleteImageset,
  processImageset,
  piiImageset,
  listImagesetFiles,
  getImagesetLastImage
} = require('../../controllers/imagesets')
const {
  attachImage,
  getImages,
  postImage,
  putImage,
  deleteImage
} = require('../../controllers/images')
const { requireStationOwnerOrAdmin, requireStationOwnerCollaboratorOrAdmin } = require('../../middleware/auth')

var router = express.Router()

router.route('/')
  .get(asyncHandler(getPublicStations))
  .post(asyncHandler(postStations))

router.route('/:stationId')
  .all(asyncHandler(attachStation))
  .get(asyncHandler(getStation))
  .put(requireStationOwnerCollaboratorOrAdmin, asyncHandler(putStation))
  .delete(requireStationOwnerOrAdmin, asyncHandler(deleteStation))

router.route('/:stationId/daily')
  .all(asyncHandler(attachStation))
  .get(asyncHandler(getStationDaily))

router.route('/:stationId/datasets')
  .all(asyncHandler(attachStation))
  .get(asyncHandler(getDatasets))
  .post(requireStationOwnerCollaboratorOrAdmin, asyncHandler(postDatasets))

router.route('/:stationId/datasets/:datasetId')
  .all(asyncHandler(attachStation), asyncHandler(attachDataset))
  .get(asyncHandler(getDataset))
  .put(requireStationOwnerCollaboratorOrAdmin, asyncHandler(putDataset))
  .delete(requireStationOwnerCollaboratorOrAdmin, asyncHandler(deleteDataset))

router.route('/:stationId/datasets/:datasetId/process')
  .all(asyncHandler(attachStation), asyncHandler(attachDataset))
  .post(requireStationOwnerCollaboratorOrAdmin, asyncHandler(processDataset))

router.route('/:stationId/datasets/:datasetId/list')
  .all(asyncHandler(attachStation), asyncHandler(attachDataset))
  .get(asyncHandler(listDatasetFiles))

router.route('/:stationId/imagesets')
  .all(asyncHandler(attachStation))
  .get(asyncHandler(getImagesets))
  .post(requireStationOwnerCollaboratorOrAdmin, asyncHandler(postImagesets))

router.route('/:stationId/imagesets/:imagesetId')
  .all(asyncHandler(attachStation), asyncHandler(attachRestrictedImageset))
  .get(asyncHandler(getImageset))
  .put(requireStationOwnerCollaboratorOrAdmin, asyncHandler(putImageset))
  .delete(requireStationOwnerCollaboratorOrAdmin, asyncHandler(deleteImageset))

router.route('/:stationId/imagesets/:imagesetId/presigned')
  .all(asyncHandler(attachStation), asyncHandler(attachRestrictedImageset))
  .get(requireStationOwnerCollaboratorOrAdmin, asyncHandler(presignImageset))

router.route('/:stationId/imagesets/:imagesetId/process')
  .all(asyncHandler(attachStation), asyncHandler(attachRestrictedImageset))
  .post(requireStationOwnerCollaboratorOrAdmin, asyncHandler(processImageset))

router.route('/:stationId/imagesets/:imagesetId/pii')
  .all(asyncHandler(attachStation), asyncHandler(attachRestrictedImageset))
  .post(requireStationOwnerCollaboratorOrAdmin, asyncHandler(piiImageset))

router.route('/:stationId/imagesets/:imagesetId/images')
  .all(asyncHandler(attachStation), asyncHandler(attachRestrictedImageset))
  .get(asyncHandler(getImages))
  .post(requireStationOwnerCollaboratorOrAdmin, asyncHandler(postImage))

router.route('/:stationId/imagesets/:imagesetId/last-image')
  .all(asyncHandler(attachStation), asyncHandler(attachRestrictedImageset))
  .get(asyncHandler(getImagesetLastImage))

router.route('/:stationId/imagesets/:imagesetId/images/:imageId')
  .all(asyncHandler(attachStation), asyncHandler(attachRestrictedImageset), asyncHandler(attachImage))
  .put(requireStationOwnerCollaboratorOrAdmin, asyncHandler(putImage))
  .delete(requireStationOwnerCollaboratorOrAdmin, asyncHandler(deleteImage))

router.route('/:stationId/imagesets/:imagesetId/list')
  .all(asyncHandler(attachStation), asyncHandler(attachRestrictedImageset))
  .get(asyncHandler(listImagesetFiles))

router.route('/:stationId/image-pairs')
  .all(asyncHandler(attachStation))
  .get(asyncHandler(getStationRandomImagePairs))

router.route('/:stationId/permissions')
  .all(asyncHandler(attachStation))
  .get(requireStationOwnerOrAdmin, asyncHandler(getStationPermissions))
  .post(requireStationOwnerOrAdmin, asyncHandler(addUserPermission))

router.route('/:stationId/permissions/:userId')
  .all(asyncHandler(attachStation))
  .delete(requireStationOwnerOrAdmin, asyncHandler(removeUserPermission))

module.exports = router
