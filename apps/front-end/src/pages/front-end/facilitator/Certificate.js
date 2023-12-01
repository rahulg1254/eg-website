import React from "react";
import { VStack, HStack, Modal, ScrollView, Button } from "native-base";
import {
  Layout,
  FrontEndTypo,
  facilitatorRegistryService,
  testRegistryService,
  AdminTypo,
  IconByName,
  CardComponent,
  useWindowSize,
} from "@shiksha/common-lib";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function Profile({ userTokenInfo, footerLinks }) {
  const { id } = userTokenInfo?.authUser || [];
  const [facilitator, setFacilitator] = React.useState();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = React.useState(true);
  const [certificateData, setCertificateData] = React.useState();
  const [downloadCertificate, setDownloadCertificate] = React.useState();
  const reportTemplateRef = React.useRef(null);

  React.useEffect(async () => {
    const result = await facilitatorRegistryService.getOne({ id });
    const getCertificate = await testRegistryService.getCertificate({
      id,
    });
    setCertificateData(getCertificate?.data);
    setFacilitator(result);
    setLoading(false);
  }, []);

  const handleGeneratePdf = async () => {
    // const doc = new jsPDF({
    //   format: "a4",
    //   unit: "px",
    // });

    // // Adding the fonts.
    // doc.setFont("Inter-Regular", "normal");

    // doc.html(reportTemplateRef.current, {
    //   async callback(doc) {
    //     await doc.save("document");
    //   },
    // });

    const input = reportTemplateRef.current;
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("l");
      pdf.addImage(imgData, "PNG", 0, 0, 297, 210); // Adjust the width and height as needed
      // pdf.output('dataurlnewwindow');
      pdf.save("download.pdf");
    });
  };

  const certificateDownload = async (data) => {
    const result = await testRegistryService.postCertificates(data);
    console.log({ result });
    setDownloadCertificate(result?.data?.[0]?.certificate_html);
  };

  return (
    <Layout
      loading={loading}
      _appBar={{
        onPressBackButton: (e) => navigate("/"),
        onlyIconsShow: ["loginBtn", "langBtn"],
        leftIcon: <FrontEndTypo.H2>{t("CERTIFICATE")}</FrontEndTypo.H2>,
      }}
      _footer={{ menues: footerLinks }}
      _page={{ _scollView: { bg: "formBg.500" } }}
    >
      <VStack space={4}>
        <VStack paddingLeft="16px" paddingRight="16px" py={4} space="4">
          {certificateData?.map((item) => {
            return (
              <CardComponent
                key={item}
                _header={{ px: "0", pt: "0" }}
                _body={{ px: "0", pb: "0" }}
                _vstack={{ p: 5, space: 0, flex: 1 }}
              >
                <HStack
                  key={item}
                  justifyContent={"space-evenly"}
                  alignItems={"center"}
                >
                  <FrontEndTypo.H2>{item?.context}</FrontEndTypo.H2>
                  <FrontEndTypo.H2>{item?.score}</FrontEndTypo.H2>
                  {item?.certificate_status === true ? (
                    <AdminTypo.Secondarybutton
                      onPress={() => certificateDownload(item)}
                    >
                      {t("DOWNLOAD")}
                    </AdminTypo.Secondarybutton>
                  ) : row.certificate_status === false ? (
                    <AdminTypo.H6 color="red.500">{t("FAILED")}</AdminTypo.H6>
                  ) : (
                    <AdminTypo.H6>{t("PENDING")}</AdminTypo.H6>
                  )}
                </HStack>
              </CardComponent>
            );
          })}
        </VStack>
      </VStack>
      <Modal isOpen={downloadCertificate} size="xl">
        <Modal.Content>
          <Modal.Header>
            <HStack
              alignItems={"center"}
              justifyContent={"space-between"}
              pr="2"
            >
              <AdminTypo.H3>{t("CERTIFICATION")}</AdminTypo.H3>
              <Button small bordered onPress={() => handleGeneratePdf()}>
                {t("DOWNLOAD")}
              </Button>
              <IconByName
                name="CloseCircleLineIcon"
                onPress={(e) => setDownloadCertificate()}
              />
            </HStack>
          </Modal.Header>
          <ScrollView horizontal={true} mb="2">
            <Modal.Body>
              <div
                id="content"
                style={{
                  backgroundColor: "#f5f5f5",
                  width: "297mm",
                  minHeight: "210mm",
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
                ref={reportTemplateRef}
              >
                <div
                  dangerouslySetInnerHTML={{ __html: downloadCertificate }}
                />
              </div>
            </Modal.Body>
          </ScrollView>
        </Modal.Content>
      </Modal>
    </Layout>
  );
}