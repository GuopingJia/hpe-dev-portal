import React from 'react';
import { Grommet } from 'grommet';
import { hpe } from 'grommet-theme-hpe';
import {
  Layout,
  PageHeader,
  Card,
  CardGrid,
} from '../../../components/hackshack';
import { SEO } from '../../../components';
import { arcadeContent } from '../../../data/CardData/PageContent';

const Arcade = () => {
  return (
    <Grommet theme={hpe}>
      <Layout background="/img/hackshack/BackgroundImages/arcade-background.jpg">
        <SEO title="Hack Shack Arcade" />
        <PageHeader title="ARCADE">
          <CardGrid>
            {arcadeContent.map((content) => (
              <Card
                key={content.title}
                title={content.title}
                alt={content.alt}
                background={content.background}
                image={content.image}
                desc={content.desc}
                label={content.label}
                link={content.link}
                path={content.path}
              />
            ))}
          </CardGrid>
        </PageHeader>
      </Layout>
    </Grommet>
  );
};

export default Arcade;
