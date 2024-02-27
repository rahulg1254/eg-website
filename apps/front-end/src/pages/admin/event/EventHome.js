import React, { useCallback, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import {
  IconByName,
  AdminLayout as Layout,
  AdminTypo,
  campService,
  CardComponent,
  UserCard,
  MapComponent,
  CheckUncheck,
  enumRegistryService,
  jsonParse,
  ImageView,
  BodyMedium,
  GetEnumValue,
  mapDistance,
  geolocationRegistryService,
  facilitatorRegistryService,
  getOptions,
  eventService,
} from "@shiksha/common-lib";
import {
  Alert,
  Box,
  Checkbox,
  HStack,
  Input,
  Menu,
  Pressable,
  Stack,
  VStack,
  useToast,
} from "native-base";
import { useTranslation } from "react-i18next";
import Form from "@rjsf/core";
import Schema from "./Schema";
import validator from "@rjsf/validator-ajv8";
import { widgets, templates } from "../../../component/BaseInput";
import moment from "moment";
import DataTable from "react-data-table-component";
import { ChipStatus } from "component/Chip";
import { debounce } from "lodash";
import { useNavigate, useParams } from "react-router-dom";

const customStyles = {
  headCells: {
    style: {
      background: "#E0E0E0",
      fontSize: "14px",
      color: "#616161",
    },
  },
  rows: {
    style: {
      minH: "45px", // override the row height
      cursor: "pointer",
    },
  },
  cells: {
    style: {
      padding: "10px 0", // Adjust as needed
      marginTop: "0", // Remove upper space
    },
  },
};

const columns = (t, handleCheckboxChange, selectedRowId) => [
  {
    name: t("NAME"),
    selector: (row) => (
      <HStack alignItems={"center"} space={2}>
        <Checkbox
          isChecked={selectedRowId.includes(row.id)}
          onChange={() => handleCheckboxChange(row?.id)}
        />
        <AdminTypo.H7 bold>{row?.id}</AdminTypo.H7>
        <AdminTypo.H6 textOverflow="ellipsis">
          {row?.first_name + " " + row?.last_name}
        </AdminTypo.H6>
      </HStack>
    ),
    sortable: false,
    width: "250px",
    attr: "name",
  },
  {
    name: t("STATUS"),
    selector: (row, index) => (
      <ChipStatus
        py="1"
        px="1"
        key={index}
        status={row?.program_faciltators?.status}
      />
    ),
    sortable: false,
    attr: "email",
    wrap: true,
  },
  {
    name: t("DISTRICT"),
    selector: (row) => (row?.district ? row?.district : "-"),
    sortable: false,
    attr: "city",
  },

  {
    name: t("BLOCK"),
    selector: (row) => (row?.block ? row?.block : "-"),
    sortable: false,
    attr: "city",
  },
  {
    name: t("PHONE_NUMBER"),
    selector: (row) => (row?.mobile ? row?.mobile : "-"),
    sortable: false,
    attr: "city",
  },
];
export default function EventHome({ footerLinks }) {
  const formRef = useRef();
  const [errors, setErrors] = useState({});
  const [schema, setSchema] = useState({});
  const nowDate = new Date();
  const [loading, setLoading] = useState(true);
  const [isListOpen, setIsListOpen] = useState(true);
  const { t } = useTranslation();
  const [paginationTotalRows, setPaginationTotalRows] = useState(0);
  const [data, setData] = useState();
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [userIds, setUserIds] = useState({});
  const [district, setDistrict] = useState();
  const [block, setBlock] = useState();
  const [village, setVillage] = useState();
  const [programData, setProgramData] = useState();
  const [filter, setFilter] = useState({});
  const [isDisabled, setIsDisabled] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();
  const { step, id } = useParams();
  const [selectedRowId, setSelectedRowIds] = useState([]);
  const [eventDetails, setEventDetails] = useState([]);

  const [formData, setFormData] = useState({});

  const handleOpenButtonClick = () => {
    setIsListOpen((prevState) => !prevState);
  };

  useEffect(async () => {
    const eventResult = await eventService.getEventListById({ id });
    const { event } = eventResult;
    setEventDetails(eventResult);
    const selectedId =
      eventResult?.event?.attendances?.map((e) => e?.user_id) || [];
    setSelectedRowIds(selectedId);
    if (id) {
      setIsListOpen(false);
      const timeFormat = "HH:mm:ss";
      setFormData({
        type: event?.type,
        name: event?.name,
        master_trainer: event?.master_trainer,
        date: JSON.stringify({
          startDate: event?.start_date,
          endDate: event?.end_date,
        }),
        start_date: event?.start_date,
        start_time: moment
          .utc(event?.start_time, `HH:mm:ssZ`)
          .format(timeFormat),
        end_date: event?.end_date,
        end_time: moment.utc(event?.end_time, `HH:mm:ssZ`).format(timeFormat),
      });
    }
  }, [id]);

  const handleCheckboxChange = (rowId) => {
    setSelectedRowIds((prevSelectedRowIds) => {
      const isSelected = prevSelectedRowIds?.includes(rowId);
      if (isSelected) {
        return prevSelectedRowIds.filter((id) => id !== rowId);
      } else {
        return [...prevSelectedRowIds, rowId];
      }
    });
  };

  useEffect(async () => {
    const result = await enumRegistryService.listOfEnum();
    let newSchema = Schema;
    newSchema = getOptions(newSchema, {
      key: "type",
      arr: result?.data?.FACILITATOR_EVENT_TYPE.map((e) => ({
        ...e,
        title: t(e.title),
      })),
      title: "title",
      value: "value",
    });
    newSchema = getOptions(newSchema, {
      key: "name",
      arr: result?.data?.EVENT_BATCH_NAME.map((e) => ({
        ...e,
        title: t(e.title),
      })),
      title: "title",
      value: "value",
    });

    setSchema(newSchema);

    if (step === "edit") {
      setSchema((prevSchema) => ({
        ...prevSchema,
        properties: {
          ...prevSchema.properties,
          type: {
            ...prevSchema?.properties?.type,
            readOnly: true,
          },
          date: {
            ...newSchema?.properties?.date,
            minDate: moment().toDate(),
            daysDiff: 4,
          },
        },
      }));
    } else {
      setSchema((newSchema) => ({
        ...newSchema,
        properties: {
          ...newSchema.properties,
          date: {
            ...newSchema?.properties?.date,
            minDate: moment().toDate(),
            daysDiff: 4,
          },
        },
      }));
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const result =
        await facilitatorRegistryService.getFacilitatorByStatusInOrientation({
          limit: limit,
          page: page,
          district: filter?.districts?.[0],
          block: filter?.blocks?.[0],
          type: formData?.type || eventDetails?.event?.type,
          search: filter?.search,
        });

      setData(result?.data?.data);
      setPaginationTotalRows(result?.totalCount);
      setLoading(false);
    };

    fetchData();
  }, [isListOpen, step, formData?.type, filter]);

  useEffect(() => {
    const fetchData = async () => {
      let programSelected = jsonParse(localStorage.getItem("program"));
      const stateName = programSelected?.state_name;
      setProgramData(stateName);
      const getDistricts = await geolocationRegistryService.getDistricts({
        name: stateName,
      });
      if (Array.isArray(getDistricts?.districts)) {
        setDistrict(getDistricts?.districts);
      }
    };
    fetchData();
  }, []);

  const blockss = useCallback(async () => {
    if (filter?.districts) {
      const blockData = await geolocationRegistryService.getMultipleBlocks({
        districts: filter?.districts,
      });
      setBlock(blockData);
    }
  }, [filter?.districts]);

  useEffect(() => {
    blockss();
  }, [filter?.districts]);

  const villageData = useCallback(async () => {
    if (programData === "BIHAR" && filter?.districts && filter?.blocks) {
      const qData = await geolocationRegistryService.getVillages({
        name: filter?.blocks?.[0],
        state: programData,
        district: filter?.districts?.[0],
        gramp: "null",
      });
      setVillage(qData?.villages);
    }
  }, [filter?.blocks]);

  useEffect(() => {
    villageData();
  }, [filter?.blocks]);

  const uiSchema = {
    date: {
      "ui:widget": "CalenderInput",
      // "ui:widget": "alt-datetime",
      // "ui:options": {
      //   hideNowButton: true,
      //   hideClearButton: true,
      //   yearsRange: [2023, 2030],
      // },
    },
    time: {
      "ui:widget": "Time",
      // "ui:widget": "hidden",
    },
  };

  const onChange = async (data, id) => {
    setErrors({});
    const newData = data.formData;
    setFormData({ ...formData, ...newData });
    if (id === "root_type") {
      setSelectedRowIds([]);
    }
    if (newData?.end_date) {
      if (
        moment.utc(newData?.start_date).isAfter(moment.utc(newData?.end_date))
      ) {
        const newErrors = {
          end_date: {
            __errors: [t("EVENT_CREATE_END_DATE_GREATERE_THAN_START_DATE")],
          },
        };
        setErrors(newErrors);
      }
    }

    if (moment.utc(newData?.start_date) < moment.utc(nowDate)) {
      const newErrors = {
        start_date: {
          __errors: [t("EVENT_CREATE_BACK_DATES_NOT_ALLOWED_START_DATE")],
        },
      };
      setErrors(newErrors);
    }

    if (moment.utc(newData?.end_date) < moment.utc(nowDate)) {
      const newErrors = {
        end_date: {
          __errors: [t("EVENT_CREATE_BACK_DATES_NOT_ALLOWED_END_DATE")],
        },
      };
      setErrors(newErrors);
    }
  };

  const onSubmit = async (data) => {
    let newFormData = data?.formData;

    if (Object.keys(errors).length === 0) {
      setIsDisabled(true);
      setFormData(newFormData);
      const { startDate, endDate } = JSON.parse(newFormData.date || "{}");
      const obj = {
        ...newFormData,
        start_date: moment(startDate).format("YYYY-MM-DD"),
        end_date: moment(endDate).format("YYYY-MM-DD"),
        attendees: selectedRowId,
      };
      if (step === "edit") {
        const data = await eventService.updateEvent(id, obj);
        if (data?.success === true) {
          setIsDisabled(false);
          navigate(`/admin/event/${data?.data?.events?.id}`);
        }
      } else {
        const apiResponse = await eventService.createNewEvent(obj);
        if (apiResponse?.success === true) {
          setIsDisabled(false);
          toast.show({
            render: () => {
              return (
                <Alert status="success" alignItems={"start"} mb="3" mt="4">
                  <HStack alignItems="center" space="2" color>
                    <Alert.Icon />
                    <BodyMedium>{t("EVENT_CREATED_SUCCESSFULLY")}</BodyMedium>
                  </HStack>
                </Alert>
              );
            },
          });

          navigate(`/admin`);
        } else {
          toast.show({
            render: () => {
              return (
                <Alert status="error" alignItems={"start"} mb="3" mt="4">
                  <HStack alignItems="center" space="2" color>
                    <Alert.Icon />
                    <BodyMedium>{apiResponse?.message}</BodyMedium>
                  </HStack>
                </Alert>
              );
            },
          });
        }
      }
    } else {
      setIsDisabled(false);
      alert(t("EVENT_CREATE_CORRECT_DATA_MESSAGE"));
    }
  };

  const transformErrors = (errors, uiSchema) => {
    return errors.map((error) => {
      if (error.name === "required") {
        if (schema?.properties?.[error?.property]?.title) {
          error.message = `${t("REQUIRED_MESSAGE")} "${t(
            schema?.properties?.[error?.property]?.title
          )}"`;
        } else {
          error.message = `${t("REQUIRED_MESSAGE")}`;
        }
      } else if (error.name === "enum") {
        error.message = `${t("SELECT_MESSAGE")}`;
      } else if (error.name === "format") {
        const { format } = error?.params || {};
        let message = "REQUIRED_MESSAGE";
        if (format === "email") {
          message = "PLEASE_ENTER_VALID_EMAIL";
        }
        if (format === "string") {
          message = "PLEASE_ENTER_VALID_STREING";
        } else if (format === "number") {
          message = "PLEASE_ENTER_VALID_NUMBER";
        }

        if (schema?.properties?.[error?.property]?.title) {
          error.message = `${t(message)} "${t(
            schema?.properties?.[error?.property]?.title
          )}"`;
        } else {
          error.message = `${t(message)}`;
        }
      }
      return error;
    });
  };
  const handleSearch = (e) => {
    setFilter({ ...filter, search: e.nativeEvent.text, page: 1 });
  };
  const debouncedHandleSearch = useCallback(debounce(handleSearch, 1000), []);

  const updateSelected = async () => {
    const obj = {
      formData,
      attendees: selectedRowId,
    };
    if (step) {
      const data = await eventService.updateEvent(id, obj);
      if (data?.success === true) {
        setIsDisabled(true);
        navigate(`/admin/event/${id}`);
      }
    }
  };

  return (
    <Layout
      _sidebar={footerLinks}
      // loading={loading}
    >
      <VStack p={4}>
        <HStack pt="3" justifyContent={"space-between"}>
          <HStack alignItems={"center"} space={3}>
            <IconByName name="home" size="md" />
            <AdminTypo.H1 color="Activatedcolor.400">{t("HOME")}</AdminTypo.H1>
            <IconByName
              size="sm"
              name="ArrowRightSLineIcon"
              onPress={(e) => navigate(`/admin`)}
            />
            <AdminTypo.H1
              color="textGreyColor.800"
              whiteSpace="nowrap"
              overflow="hidden"
              textOverflow="ellipsis"
            >
              {t("SCHEDULE_EVENT")}
            </AdminTypo.H1>
          </HStack>

          {step === "candidate" && (
            <AdminTypo.Secondarybutton onPress={updateSelected}>
              {t("SAVE_EVENT")}
            </AdminTypo.Secondarybutton>
          )}
        </HStack>
        {step !== "candidate" ? (
          <HStack pt={6} justifyContent={"space-between"}>
            <VStack width={"28%"} background={"whiteSomke"} p={4}>
              <Form
                ref={formRef}
                extraErrors={errors}
                showErrorList={false}
                noHtml5Validate={true}
                {...{
                  widgets,
                  templates,
                  validator,
                  schema: schema,
                  uiSchema,
                  formData,
                  onChange,
                  onSubmit,
                  transformErrors,
                }}
              >
                <AdminTypo.PrimaryButton
                  // isDisabled={isDisabled}
                  onPress={() => {
                    formRef?.current?.submit();
                  }}
                >
                  {step === "edit" ? t("SAVE_EVENT") : t("SCHEDULE_EVENT")}
                </AdminTypo.PrimaryButton>
              </Form>
            </VStack>
            <VStack
              width={"70%"}
              bg={isListOpen ? "zambezi" : "white"}
              justifyContent={isListOpen && "center"}
            >
              {isListOpen ? (
                <VStack p={4}>
                  <AdminTypo.Secondarybutton onPress={handleOpenButtonClick}>
                    {t("SELECT_CANDIDATE")}
                  </AdminTypo.Secondarybutton>
                </VStack>
              ) : (
                <VStack background={"whiteSomke"}>
                  <HStack space={4} pb={4}>
                    <Input
                      minH="32px"
                      InputLeftElement={
                        <IconByName
                          color="coolGray.500"
                          name="SearchLineIcon"
                          isDisabled
                          pl="2"
                          // height="2"
                        />
                      }
                      placeholder={t("SEARCH_BY_NAME")}
                      variant="outline"
                      onChange={debouncedHandleSearch}
                    />
                    <Stack
                      style={{
                        width: "55%",
                      }}
                    >
                      <HStack
                        style={{
                          // display: "flex",
                          justifyContent: "space-around",
                        }}
                      >
                        <AdminTypo.H4 bold>{t("FILTERS")}:-</AdminTypo.H4>
                        <AdminTypo.H4>
                          {filter?.districts
                            ? filter?.districts
                            : t("DISTRICT")}
                        </AdminTypo.H4>
                        <District district={district} setFilter={setFilter} />
                        <AdminTypo.H4>
                          {filter?.blocks ? filter?.blocks : t("BLOCK")}
                        </AdminTypo.H4>
                        <Blocks block={block} setFilter={setFilter} />
                        {programData === "BIHAR" && (
                          <HStack space={4}>
                            <AdminTypo.H4>
                              {filter?.villages
                                ? filter?.village
                                : t("VILLAGE")}
                            </AdminTypo.H4>
                            <Village village={village} setFilter={setFilter} />
                          </HStack>
                        )}
                      </HStack>
                    </Stack>
                  </HStack>
                  <Stack alignSelf={"end"} pb={2} pr={4}>
                    <AdminTypo.H6 bold color="textBlue.200">
                      {`${t("ADD_SELECTED")} (${selectedRowId?.length ?? 0})`}
                    </AdminTypo.H6>
                  </Stack>
                  <DataTable
                    columns={columns(t, handleCheckboxChange, selectedRowId)}
                    data={data}
                    customStyles={customStyles}
                    persistTableHead
                    // selectableRows
                    progressPending={loading}
                    pagination
                    paginationServer
                    onSelectedRowsChange={handleCheckboxChange}
                    paginationTotalRows={paginationTotalRows}
                    clearSelectedRows={
                      Object.keys(userIds).length === 0 ? true : false
                    }
                    onChangeRowsPerPage={(e) => {
                      setFilter({ ...filter, limit: e, page: 1 });
                    }}
                    onChangePage={(e) => {
                      setFilter({ ...filter, page: e });
                    }}
                  />
                </VStack>
              )}
            </VStack>
          </HStack>
        ) : (
          <VStack mt={4} p={4} background={"whiteSomke"}>
            <HStack space={4} pb={4}>
              <Input
                minH="32px"
                InputLeftElement={
                  <IconByName
                    color="coolGray.500"
                    name="SearchLineIcon"
                    isDisabled
                    pl="2"
                    // height="2"
                  />
                }
                placeholder={t("SEARCH_BY_NAME")}
                variant="outline"
                onChange={debouncedHandleSearch}
              />
              <Stack
                style={{
                  width: "55%",
                }}
              >
                <HStack
                  style={{
                    // display: "flex",
                    justifyContent: "space-around",
                  }}
                >
                  <AdminTypo.H4 bold>{t("FILTERS")}:-</AdminTypo.H4>
                  <AdminTypo.H4>
                    {filter?.districts ? filter?.districts : t("DISTRICT")}
                  </AdminTypo.H4>
                  <District district={district} setFilter={setFilter} />
                  <AdminTypo.H4>
                    {filter?.blocks ? filter?.blocks : t("BLOCK")}
                  </AdminTypo.H4>
                  <Blocks block={block} setFilter={setFilter} />
                  {programData === "BIHAR" && (
                    <HStack space={4}>
                      <AdminTypo.H4>
                        {filter?.villages ? filter?.village : t("VILLAGE")}
                      </AdminTypo.H4>
                      <Village village={village} setFilter={setFilter} />
                    </HStack>
                  )}
                </HStack>
              </Stack>
            </HStack>
            <HStack alignSelf={"end"} space={4} pb={2} pr={4}>
              <AdminTypo.H6 bold color="textBlue.200">
                {`${t("ADD_SELECTED")} (${selectedRowId?.length ?? 0})`}
              </AdminTypo.H6>
            </HStack>
            <DataTable
              columns={columns(t, handleCheckboxChange, selectedRowId)}
              data={data}
              customStyles={customStyles}
              persistTableHead
              // selectableRows
              progressPending={loading}
              pagination
              paginationServer
              onSelectedRowsChange={handleCheckboxChange}
              paginationTotalRows={paginationTotalRows}
              clearSelectedRows={
                Object.keys(userIds).length === 0 ? true : false
              }
              onChangeRowsPerPage={(e) => {
                setFilter({ ...filter, limit: e, page: 1 });
              }}
              onChangePage={(e) => {
                setFilter({ ...filter, page: e });
              }}
            />
          </VStack>
        )}
      </VStack>
    </Layout>
  );
}

const District = ({ district, setFilter }) => {
  return (
    <Menu
      shadow={2}
      trigger={(triggerProps) => {
        return (
          <Pressable accessibilityLabel="More options menu" {...triggerProps}>
            <IconByName name="ArrowDownSLineIcon" />
          </Pressable>
        );
      }}
    >
      {district &&
        district.map &&
        district.map((e) => (
          <Menu.Item
            key={e?.district_id}
            onPress={() =>
              setFilter((prevFilter) => ({
                ...prevFilter,
                districts: [e?.district_name],
              }))
            }
          >
            {e?.district_name}
          </Menu.Item>
        ))}
    </Menu>
  );
};

const Blocks = ({ block, setFilter }) => {
  return (
    <Menu
      shadow={2}
      trigger={(triggerProps) => {
        return (
          <Pressable accessibilityLabel="More options menu" {...triggerProps}>
            <IconByName name="ArrowDownSLineIcon" />
          </Pressable>
        );
      }}
    >
      {block &&
        block?.map &&
        block?.map((e) => (
          <Menu.Item
            key={e?.block_name}
            onPress={() =>
              setFilter((prevFilter) => ({
                ...prevFilter,
                blocks: [e?.block_name],
              }))
            }
          >
            {e?.block_name}
          </Menu.Item>
        ))}
    </Menu>
  );
};

const Village = ({ village, setFilter }) => {
  return (
    <Menu
      shadow={2}
      trigger={(triggerProps) => {
        return (
          <Pressable accessibilityLabel="More options menu" {...triggerProps}>
            <IconByName name="ArrowDownSLineIcon" />
          </Pressable>
        );
      }}
    >
      {village?.map((e) => (
        <Menu.Item
          key={e?.block_id}
          onPress={() =>
            setFilter((prevFilter) => ({
              ...prevFilter,
              villages: [e?.village_ward_name],
            }))
          }
        >
          {e?.village_ward_name}
        </Menu.Item>
      ))}
    </Menu>
  );
};

EventHome.propTypes = {
  footerLinks: PropTypes.any,
};

District.propTypes = {
  district: PropTypes.string,
  setFilter: PropTypes.array,
};

Blocks.propTypes = {
  district: PropTypes.string,
  setFilter: PropTypes.array,
};
Village.propTypes = {
  district: PropTypes.string,
  setFilter: PropTypes.array,
};
