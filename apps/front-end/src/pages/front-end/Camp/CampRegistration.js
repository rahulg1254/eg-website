import {
  FrontEndTypo,
  IconByName,
  Layout,
  CampService,
  ConsentService,
  arrList,
  BodyMedium,
} from "@shiksha/common-lib";
import {
  HStack,
  Box,
  Pressable,
  Text,
  Image,
  Avatar,
  Alert,
} from "native-base";
import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

const getColor = (obj, arr) => {
  const result = arrList(obj, arr);
  let color = "gray.300";
  if (result === 100) {
    color = "green.300";
  } else if (result > 20) {
    color = "amber.300";
  }
  return color;
};

export default function CampRegistration({ userTokenInfo, footerLinks }) {
  const navigate = useNavigate();
  const camp_id = useParams();
  const { t } = useTranslation();
  const [loading, setLoading] = React.useState(true);
  const [campLocation, setCampLocation] = React.useState();
  const [campVenue, setCampVenue] = React.useState();
  const [campStatus, setCampStatus] = React.useState();
  const [facilities, setFacilities] = React.useState();
  const [kit, setKit] = React.useState();
  const [kitarr, setKitarr] = React.useState([]);
  const [consent, setConsent] = React.useState("amber.300");

  React.useEffect(async () => {
    setLoading(true);
    const result = await CampService.getCampDetails(camp_id);
    setCampStatus(result?.data?.group?.status);
    const campConsent = await ConsentService.getConsent({
      camp_id: camp_id?.id,
    });
    const userLength = result?.data?.group_users?.length;
    const campConsentLength = campConsent?.data?.length;
    if (userLength <= campConsentLength) {
      setConsent("green.300");
    }
    const data = result?.data?.properties;
    setCampLocation({
      lat: data?.lat,
      long: data?.long,
      property_type: data?.property_type,
      state: data?.state,
      district: data?.district,
      block: data?.block,
      village: data?.village,
      grampanchayat: data?.grampanchayat,
    });
    setCampVenue({
      property_photo_building: data?.property_photo_building,
      property_photo_classroom: data?.property_photo_classroom,
      property_photo_other: data?.property_photo_other,
    });
    setFacilities({ property_facilities: data?.property_facilities });
    setKit({
      kit_feedback: result?.data?.kit_feedback,
      kit_ratings: result?.data?.kit_ratings,
      kit_was_sufficient: result?.data?.kit_was_sufficient,
      kit_received: result?.data?.kit_received,
    });
    setKitarr([
      "kit_received",
      "kit_was_sufficient",
      "kit_ratings",
      "kit_feedback",
    ]);

    setLoading(false);
  }, []);

  const Navdata = [
    {
      Icon: "MapPinLineIcon",
      Name: "CAMP_LOCATION",
      step: "edit_camp_location",
      color: getColor(campLocation, [
        "lat",
        "long",
        "property_type",
        "state",
        "district",
        "block",
        "village",
        "grampanchayat",
      ]),
    },
    {
      Icon: "CameraLineIcon",
      Name: "CAMP_VENUE_PHOTOS",
      step: "edit_photo_details",
      color: getColor(campVenue, [
        "property_photo_building",
        "property_photo_classroom",
      ]),
    },
    {
      Icon: "StarLineIcon",
      Name: "FACILITIES",
      step: "edit_property_facilities",

      color: getColor(facilities, ["property_facilities"]),
    },
    {
      Icon: "MapPinLineIcon",
      Name: "KIT",
      step: "edit_kit_details",
      color: getColor(kit, kitarr),
    },

    {
      Icon: "CheckboxLineIcon",
      Name: "FAMILY_CONSENT",
      step: "edit_family_consent",
      color: consent,
    },
  ];

  const onPressBackButton = async () => {
    navigate("/camps");
  };

  // Check if all specified names have the color "green.300"
  const isDisabled = () => {
    if (campStatus === "registered") {
      return false;
    } else if (
      ["CAMP_LOCATION", "FACILITIES", "KIT"].every((name) =>
        Navdata.some((item) => item.Name === name && item.color === "green.300")
      )
    ) {
      return true;
    }
  };
  const SubmitCampRegistration = async () => {
    const obj = {
      id: camp_id?.id,
      status: "registered",
      edit_page_type: "edit_camp_status",
    };
    const data = await CampService.updateCampDetails(obj);
    if (data) {
      navigate("/camps");
    }
  };

  return (
    <Layout
      loading={loading}
      _page={{ _scollView: { bg: "bgGreyColor.200" } }}
      _appBar={{
        name: t("CAMP_REGISTER"),
        onPressBackButton,
        _box: { bg: "white" },
      }}
    >
      <HStack margin={"auto"} mt={3} space={4}>
        <HStack space={2} alignItems={"center"}>
          <Avatar bg="gray.300" size={"sm"}></Avatar>
          <Text>{t("NOT_STARTED")}</Text>
        </HStack>
        <HStack space={2} alignItems={"center"}>
          <Avatar bg="amber.300" size={"sm"}></Avatar>
          <Text>{t("IN_PROGRESS")}</Text>
        </HStack>
        <HStack space={2} alignItems={"center"}>
          <Avatar bg="green.300" size={"sm"}></Avatar>
          <Text>{t("COMPLETED")}</Text>
        </HStack>
      </HStack>

      <HStack w={"90%"} marginTop={3} marginBottom={2} margin={"auto"}>
        <Box
          bg="boxBackgroundColour.100"
          borderColor="btnGray.100"
          borderRadius="10px"
          borderWidth="1px"
          shadow="AlertShadow"
          w={"95%"}
          paddingX={5}
          paddingY={3}
          ml={5}
        >
          <Pressable
            onPress={async () => {
              navigate(`/camps/${camp_id?.id}/edit_camp_selected_learners`);
            }}
          >
            <HStack justifyContent={"space-between"}>
              <HStack alignItems={"center"}>
                <IconByName
                  isDisabled
                  name={"GraduationCap"}
                  _icon={{ size: "30px" }}
                />

                <Text ml={5}>{t("UPDATE_LEARNER")}</Text>
              </HStack>
              <IconByName
                isDisabled
                name="ArrowRightSLineIcon"
                _icon={{ size: "30px" }}
              />
            </HStack>
          </Pressable>
        </Box>
      </HStack>

      {Navdata.map((item) => {
        return (
          <NavigationBox
            key={item}
            camp_id={camp_id}
            IconName={item?.Icon}
            NavName={item?.Name}
            step={item?.step}
            color={item?.color}
          />
        );
      })}
      {campStatus === "registered" && (
        <Alert
          status="warning"
          alignItems={"start"}
          mb="3"
          mt="4"
          width={"100%"}
        >
          <HStack alignItems="center" space="2" color>
            <Alert.Icon />
            <BodyMedium>{t("CAMP_APPROVAL_MSG")}</BodyMedium>
          </HStack>
        </Alert>
      )}
      <HStack my={3} mx={"auto"} w={"90%"}>
        <FrontEndTypo.Primarybutton
          isDisabled={!isDisabled()}
          width={"100%"}
          onPress={() => {
            SubmitCampRegistration();
          }}
        >
          {t("SUBMIT_FOR_REGISTRATION")}
        </FrontEndTypo.Primarybutton>
      </HStack>
    </Layout>
  );
}

const NavigationBox = ({ IconName, NavName, camp_id, color, step }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const navToForm = (step) => {
    navigate(`/camps/${camp_id?.id}/${step}`);
  };

  return (
    <HStack w={"90%"} marginTop={3} marginBottom={2} margin={"auto"}>
      <HStack
        background={color}
        borderTopLeftRadius={"20px"}
        borderBottomLeftRadius={"20px"}
        w={"10px"}
      ></HStack>
      <Box
        bg="boxBackgroundColour.100"
        borderColor="btnGray.100"
        borderRadius="10px"
        borderWidth="1px"
        shadow="AlertShadow"
        w={"95%"}
        paddingX={5}
        paddingY={3}
        ml={2}
      >
        <Pressable
          onPress={async () => {
            navToForm(step);
          }}
        >
          <HStack justifyContent={"space-between"}>
            <HStack alignItems={"center"}>
              {NavName === "KIT" ? (
                <Image
                  source={{
                    uri: "/boxline.svg",
                  }}
                  alt=""
                  size={"28px"}
                  resizeMode="contain"
                />
              ) : (
                <IconByName
                  isDisabled
                  name={IconName}
                  //color="amber.400"
                  _icon={{ size: "30px" }}
                />
              )}

              <Text ml={5}>
                {t(NavName)}
                {!["CAMP_VENUE_PHOTOS", "FAMILY_CONSENT"].includes(NavName) && (
                  <Text color={"textMaroonColor.400"}>*</Text>
                )}
              </Text>
            </HStack>
            <IconByName
              isDisabled
              name="ArrowRightSLineIcon"
              //color="amber.400"
              _icon={{ size: "30px" }}
            />
          </HStack>
        </Pressable>
      </Box>
    </HStack>
  );
};
