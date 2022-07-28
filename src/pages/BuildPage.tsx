import React, { useEffect } from 'react';
import styled from '@emotion/styled';
import { useHistory, useParams, useLocation } from 'react-router-dom';

import { BuildState } from 'states';
import { Buttons, Images, Page } from 'components';
import { BuildUtils, FormatUtils, StorageUtils } from 'utils';
import { Colors } from 'styles';
import { BuildService } from 'services';
import { FaRedo, FaTimes } from 'react-icons/fa';

const ComponentContainer = styled.div`
  margin-bottom: 1rem;
  a {
    margin-right: 1rem;
  }
`;

const ComponentTitle = styled.div`
  display: flex;
  align-items: center;
  font-size: 1.3rem;
  font-weight: bold;
`;

const ComponentInfoContainer = styled.div<{ isCompact: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  ${({ isCompact }) =>
    isCompact
      ? ''
      : `
  border: 1px solid ${Colors.GreyDark};
  border-radius: 1rem;
  margin-left: 3.5em;
  padding: 1rem;
  `}
`;

const ComponentName = styled.div`
  margin-left: 0.5rem;
  font-size: 1.3rem;
  font-weight: bold;
`;

const ComponentPrice = styled.div`
  font-size: 1.3rem;
  font-weight: bold;
  text-align: right;
`;

const AvailabilityNotification = styled.div`
  text-align: right;
  font-size: 1rem;
`;

const ComponentNameImageContainer = styled.a`
  display: flex;
  align-items: center;
  color: ${Colors.Black};
  text-decoration: underline;
`;

const RemoveIcon = styled(FaTimes)`
  width: 2rem;
  color: #929292;
  font-size: 1.5rem;
  cursor: pointer;
`;

const TopContainer = styled.div`
  display: flex;
  justify-content: space-between;
`;

const TotalPrice = styled.div`
  font-size: 1.3rem;
  text-decoration: underline;
  font-weight: bold;
`;

const ClearButton = styled(Buttons.Button)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;

  svg {
    margin-right: 0.5rem;
  }
`;

const ComponentNames: { [x: string]: string } = {
  cpu: 'Örgjörvi',
  cpuCooler: 'Kæling',
  motherboard: 'Móðurborð',
  memory: 'Vinnsluminni',
  gpu: 'Skjákort',
  ssd: 'SSD',
  hdd: 'HDD',
  case: 'Kassi',
  psu: 'Aflgjafi',
  monitor: 'Skjár',
};

type HomeRouteParams = {
  buildId: string;
};

const BuildPage: React.FC = () => {
  const buildState: any = BuildState.useState();
  const stateBuild: any = buildState.get();
  const { buildId: routeBuildId }: HomeRouteParams = useParams();
  const history = useHistory();
  const location = useLocation();
  const isCompact = location.pathname.endsWith('/compact');

  useEffect(() => {
    const init = async () => {
      // We have the build in state, so we don't have to get from storage or server
      if (stateBuild.buildId) {
        return;
      }
      let currentBuild;
      if (routeBuildId) {
        currentBuild = await BuildService.getBuild(routeBuildId);
      } else {
        const storageBuildId: string = await StorageUtils.getItem('buildId');
        if (storageBuildId) {
          currentBuild = await BuildService.getBuild(storageBuildId);
        }
      }
      if (currentBuild?.buildId) {
        history.push(
          `/build/${currentBuild?.buildId}${isCompact ? '/compact' : ''}`,
        );
      }
      buildState.set({ ...BuildState.defaultBuild, ...currentBuild });
    };
    init();
    // eslint-disable-next-line
  }, []);

  const totalPrice = Object.keys(stateBuild).reduce((accumulator, key) => {
    const component = stateBuild[key];
    return accumulator + (component?.selectedOffering?.price ?? 0);
  }, 0);

  const Component: React.FC<{ componentKey: string }> = ({ componentKey }) => {
    if (componentKey === 'buildId') return null;
    const component = stateBuild[componentKey];
    const Button = component ? Buttons.EditButton : Buttons.AddButton;
    const isCheapest =
      component?.selectedOffering?.price === component?.minPrice;
    return (
      <ComponentContainer>
        {!isCompact && (
          <ComponentTitle>
            <Button to={`/${componentKey}`} />
            {ComponentNames[componentKey]}
            {component && (
              <RemoveIcon
                onClick={() =>
                  BuildUtils.updateState(
                    {
                      [componentKey]: null,
                    },
                    history,
                  )
                }
              />
            )}
          </ComponentTitle>
        )}
        {component && (
          <ComponentInfoContainer isCompact={isCompact}>
            <ComponentNameImageContainer
              href={component?.selectedOffering?.url}
              target="__blank"
            >
              <Images.Thumbnail size={4} src={component.image} />
              <ComponentName>{component.name}</ComponentName>
            </ComponentNameImageContainer>
            <ComponentPrice>
              {component.offerings.length > 1 ? (
                <Buttons.OfferingsButton
                  offerings={component.offerings}
                  onSelect={(offering) => {
                    BuildUtils.updateState(
                      {
                        [componentKey]: {
                          ...component,
                          selectedOffering: offering,
                        },
                      },
                      history,
                    );
                  }}
                >
                  {`${
                    component?.selectedOffering.retailerName
                  } - ${FormatUtils.formatCurrency(
                    component.selectedOffering.price,
                  )}`}
                </Buttons.OfferingsButton>
              ) : (
                `${
                  component.selectedOffering.retailerName
                } - ${FormatUtils.formatCurrency(
                  component.selectedOffering.price,
                )}`
              )}
              {!isCheapest && (
                <AvailabilityNotification>Til ódýrara</AvailabilityNotification>
              )}
              {component.selectedOffering.disabled && (
                <AvailabilityNotification>
                  Ekki lengur í boði hjá söluaðila
                </AvailabilityNotification>
              )}
            </ComponentPrice>
          </ComponentInfoContainer>
        )}
      </ComponentContainer>
    );
  };

  return (
    <Page title={`${isCompact ? 'Íhlutir' : 'Veldu íhluti'}`}>
      <TopContainer>
        {!isCompact && (
          <ClearButton onClick={() => BuildUtils.clearState(history)}>
            <FaRedo />
            Byrja upp á nýtt
          </ClearButton>
        )}
        <TotalPrice>
          Samtals: {FormatUtils.formatCurrency(totalPrice)}
        </TotalPrice>
      </TopContainer>
      {Object.keys(stateBuild).map((componentKey: string) => (
        <Component key={componentKey} componentKey={componentKey} />
      ))}
    </Page>
  );
};

export default BuildPage;
